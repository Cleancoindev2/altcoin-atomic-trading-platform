import {ChangeDetectorRef, Component, OnInit, HostListener} from "@angular/core";
import {DataSource} from "@angular/cdk/collections";
import {Observable} from "rxjs/Observable";
import {AppState} from "../../reducers/app.state";
import {Store} from "@ngrx/store";
import * as sideB from "../../actions/side-B.action";
import {CoinFactory} from "../../models/coins/coin.model";
import {OrderMatchingService} from "../../services/order-matching.service";
import {Subscription} from "rxjs/Subscription";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {Subject} from "rxjs/Subject";
import {FormControl} from "@angular/forms";
import {startWith} from "rxjs/operators/startWith";
import {map} from "rxjs/operators/map";
import * as moment from 'moment';

export class Filter {
  constructor(public name: string, public icon: string) {
  }
}

@Component({
  selector: 'app-recent-trades',
  templateUrl: './recent-trades.component.html',
  styleUrls: ['./recent-trades.component.scss']
})
export class RecentTradesComponent implements OnInit {

  displayedColumns = ["from", "to", "trade"];
  dataSource;
  dataSubject = new BehaviorSubject<any[]>([]);
  pageChanges = new Subject<any>();
  fromFilterAction = new Subject<any>();
  toFilterAction = new Subject<any>();
  socketSubscription: Subscription;

  tableOrderLength = 0;
  tableOrderPageSize = 10;

  fromCtrl: FormControl;
  fromFilterFiltered: Observable<any[]>;
  fromFilter: Filter[] = [];

  toCtrl: FormControl;
  toFilterFiltered: Observable<any[]>;
  toFilter: Filter[] = [];

  constructor(private store: Store<AppState>, private wsOrderService: OrderMatchingService,
    private changeDetectorRefs: ChangeDetectorRef) {

      this.dataSource = new OrderDataSource(this.dataSubject);

      this.fromCtrl = new FormControl();
      this.fromFilterFiltered = this.fromCtrl.valueChanges
      .pipe(
      startWith(""),
      map(coin => coin ? this.filterFromOrders(coin) : this.fromFilter.slice())
      );

      this.toCtrl = new FormControl();
      this.toFilterFiltered = this.toCtrl.valueChanges
      .pipe(
      startWith(""),
      map(coin => coin ? this.filterToOrders(coin) : this.toFilter.slice())
      );
    }

    filterFromOrders(name: string) {
      return this.fromFilter.filter(state =>
      state.name.toLowerCase().indexOf(name.toLowerCase()) === 0);
    }

    filterToOrders(name: string) {
      return this.toFilter.filter(state =>
      state.name.toLowerCase().indexOf(name.toLowerCase()) === 0);
    }

    ngOnInit() {
      this.wsOrderService.connect();
      this.socketSubscription = this.wsOrderService.messages
      .combineLatest(this.pageChanges, this.fromFilterAction, this.toFilterAction)
      .subscribe(([message, page, fromOrderFilter, toOrderFilter]) => {
      const jsonMessage = JSON.parse(message);
      if (jsonMessage.message === "getLatestOrders") {
      console.log('got latest orders ', jsonMessage.data);
      const fromFilter = []
      const toFilter = [];
      this.tableOrderLength = jsonMessage.data.length;
      const coins = jsonMessage.data.map(msg => {
        msg.fromCoin = CoinFactory.createCoinFromString(msg.from);
        msg.toCoin = CoinFactory.createCoinFromString(msg.to);
        msg.relativeDate = moment(msg.expiration).subtract(2, 'hours').fromNow();
        const exist = fromFilter.find(coin => {
          return coin.name === msg.fromCoin.name;
        });

        // TODO eye bleeding warning

        if (!exist) {
          fromFilter.push({
            name: msg.fromCoin.name,
            icon: msg.fromCoin.icon,
          });
        }
        const existto = toFilter.find(coin => {
          return coin.name === msg.toCoin.name;
        });
        if (!existto) {
          toFilter.push({
            name: msg.toCoin.name,
            icon: msg.toCoin.icon,
          });
        }
        return msg;
      }).filter(msg => {
        if (fromOrderFilter === "") {
          return true;
        }

        if (msg.fromCoin.name === fromOrderFilter) {
          return true;
        }

        return false;
      }).filter(msg => {
        if (toOrderFilter === "") {
          return true;
        }

        if (msg.toCoin.name === toOrderFilter) {
          return true;
        }

        return false;
      });

      this.fromFilter = Array.from(fromFilter);
      this.toFilter = Array.from(toFilter);

      jsonMessage.data = this.paginate(coins, page.pageSize, page.pageIndex);

      this.dataSubject.next(jsonMessage.data);
      if (!this.changeDetectorRefs["destroyed"]) {
        this.changeDetectorRefs.detectChanges();
      }
      }
    });

    this.wsOrderService.send("{\"type\": \"getLatestOrders\"}");
    }

    ngOnDestroy() {
      this.changeDetectorRefs.detach();
    }

    ngAfterViewInit() {
      this.pageChanges.next({pageIndex: 0, pageSize: 10, length: 10});
      this.fromFilterAction.next("");
      this.toFilterAction.next("");
    }

    onPageChange(pageChange: any) {
      this.pageChanges.next(pageChange);
      // {pageIndex: 0, pageSize: 1, length: 1}
    }


    onFromSelected(fromCoin) {
      this.fromFilterAction.next(fromCoin.option.value);
    }

    onToSelected(toCoin) {
      this.toFilterAction.next(toCoin.option.value);
    }

    paginate(array, page_size, page_number) {
      return array.slice(page_number * page_size, (page_number + 1) * page_size);
    }

    clearFilters() {
      this.fromFilterAction.next("");
    }

}

export class OrderDataSource extends DataSource<any> {

  constructor(private subject: BehaviorSubject<any[]>) {
    super();
  }

  connect(): Observable<any[]> {
    return this.subject.asObservable();
  }

  disconnect() {}

}
