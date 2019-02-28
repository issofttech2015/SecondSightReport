import { Component, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { Http, Headers } from '@angular/http';
import { map } from 'rxjs/operators';
import { DxDataGridComponent } from 'devextreme-angular';
import DataSource from 'devextreme/data/data_source';
declare var $: any; // JQueryStatic will give you a typed reference to jQuery.
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  host: { '(window:keydown)': 'windowKeyDownEvent($event)', '(window:keyup)': 'windowKeyUpEvent($event)' }
})
export class AppComponent {
  subscriptions: Subscription;
  @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
  rootNode: any; // store rootNode: ElementRef reference
  cellInfo: any = {
    rowIndex: -1,
    columnIndex: 0
  }
  deferredDetailStore: any;
  details: any = {
    dataList: [],
    columnForDisplay: [],
    exportFileName: "",
    primaryKey: "",
    endpoint: "",
    heading: ""
  };
  // dataList: any = [];
  // columnForDisplay: any = [];
  // exportFileName: string = "";
  // primaryKey: string = "";
  // endpoint: any;
  constructor(private http: Http,
    rootNode: ElementRef,
    private activatedRoute: ActivatedRoute) {
    this.rootNode = rootNode;
    this.callConstructor();
  }

  callConstructor() {
    this.http
      .get('./assets/mydata.json')
      .pipe(map(response => response.json()))
      .subscribe(d => {
        // console.log(d);
        this.details.endpoint = "http://" + d['ip'] + "/SecondSightAPI";
        // console.log("http://" + d["ip"] + "/SecondSightAPI");
        // this.details.endpoint = "http://192.168.1.40/SecondSightAPI";
        // this.details.endpoint = "http://localhost:53366";
        this.setDataSource();
        this.activatedRoute.queryParams.subscribe(params => {
          console.log(params);
          if (JSON.stringify(params) !== JSON.stringify({})) {
            let dataObj = this.jsonData()[0][params.key];
            this.details.columnForDisplay = dataObj.columnForDisplay;
            this.details.primaryKey = dataObj.primaryKey;
            this.details.exportFileName = dataObj.exportFileName;
            this.details.heading = dataObj.heading
            // this.columnForDisplay = dataObj.columnForDisplay;
            // this.primaryKey = dataObj.primaryKey;
            // this.exportFileName = dataObj.exportFileName;
            this.setDataSource();
            switch (dataObj.requestType) {
              case 'POST':
                this.http
                  .post(this.details.endpoint + dataObj.path, JSON.parse(params.EmployeeObj))
                  .pipe(map(response => response.json()))
                  .subscribe(d => {
                    console.log(d);
                    this.details.dataList = d;
                    // this.dataList = d;
                    this.setDataSource();
                  }, err => {
                    console.log(err)
                  });
                break;
              case 'GET':
                this.http
                  .get(this.details.endpoint + dataObj.path)
                  .pipe(map(response => response.json()))
                  .subscribe(d => {
                    console.log(d);
                    this.details.dataList = d;
                    // this.dataList = d;
                    this.setDataSource();
                  }, err => {
                    console.log(err)
                  });
                break;
            }

          }
          // this.test1(params);
          // this.test1();
        });
      });
  }

  private setDataSource() {
    this.deferredDetailStore = new DataSource({
      store: {
        type: 'array',
        key: this.details.primaryKey,
        data: this.details.dataList
      }
    });
  }

  ngOnInit() {
    // this.test1();
  }

  private onContentReadyHandler(e) {
    if (e.component.getDataSource()._pageSize != this.deferredDetailStore.store()._array.length + 1) {
      this.dataGrid.instance.pageSize(this.deferredDetailStore.store()._array.length + 1);
      e.component.getDataSource()._paginate = false;
    }
    if (this.cellInfo.rowIndex == -1) {
      let container = $(this.rootNode.nativeElement).find('.dx-texteditor-input');
      container.css({ 'background-color': '#ffffff', 'color': 'black' });
      this.focudOnGirdTextBox();
    }
    if (this.dataGrid.instance.totalCount() == 0) {
      let container = $(this.rootNode.nativeElement).find('.dx-texteditor-input');
      container.css({ 'background-color': '#ffffff', 'color': 'black' });
      this.focudOnGirdTextBox();
    }
  }

  private onKeyDownEventGrid(e) {
    // if (this.tepmWait) {
    let cellInfo = (this.dataGrid.instance as any)._controllers.keyboardNavigation._focusedCellPosition;
    switch (e.event.keyCode) {
      case 9://Tab
        e.event.preventDefault();
        break;
      case 13:
        e.event.preventDefault();
        break;
      case 27://Esc
        e.event.preventDefault();
        break;
      case 37:
        if (cellInfo.columnIndex > 0) {
          this.cellInfo.columnIndex = cellInfo.columnIndex - 1;
          this.cellInfo.rowIndex = cellInfo.rowIndex;
        }
        break;
      case 38:
        if (cellInfo.rowIndex > 0) {
          this.cellInfo.columnIndex = cellInfo.columnIndex;
          this.cellInfo.rowIndex = cellInfo.rowIndex - 1;
        }
        else if (this.cellInfo.rowIndex > -1) {
          this.cellInfo.columnIndex = cellInfo.columnIndex;
          this.cellInfo.rowIndex = cellInfo.rowIndex - 1;
          setTimeout(() => {
            this.focudOnGirdTextBox();
          }, 5);
        }
        break;
      case 39:
        if (cellInfo.columnIndex < this.details.columnForDisplay.length - 1) {
          this.cellInfo.columnIndex = cellInfo.columnIndex + 1;
          this.cellInfo.rowIndex = cellInfo.rowIndex;
        }
        break;
      case 40:
        if (cellInfo.rowIndex < this.dataGrid.instance.totalCount() - 1) {
          this.cellInfo.columnIndex = cellInfo.columnIndex;
          this.cellInfo.rowIndex = cellInfo.rowIndex + 1;
        }
        break;
    }
    // }
  }

  private focudOnGirdTextBox() {
    setTimeout(() => {
      let container = $(this.rootNode.nativeElement).find('#gridContainerReport .dx-texteditor-input')[this.cellInfo.columnIndex];
      container.focus();
      this.cellInfo.rowIndex = -1;
    }, 50);

  }

  private onCellClickHandler(e) {
    switch (e.rowType) {
      case 'data':
        this.dataGrid.instance.focus(e.cellElement);
        this.cellInfo.rowIndex = e.rowIndex;
        this.cellInfo.columnIndex = e.columnIndex;
        break;
      case 'filter':
        this.dataGrid.instance.focus(e.cellElement);
        this.cellInfo.rowIndex = -1;
        this.cellInfo.columnIndex = e.columnIndex;
        break;
      default:
        if (this.cellInfo.rowIndex == -1) {
          this.focudOnGirdTextBox();
        }
        else {
          this.focusOnGrid();
        }
        break;
    }
  }

  windowKeyDownEvent(e) {
    // if (this.cellInfo.rowIndex == -1 && this.tepmWait) {
    if (this.cellInfo.rowIndex == -1) {
      switch (e.keyCode) {
        case 9://Tab
          e.preventDefault();
          break;
        case 27://Esc
          e.preventDefault();
          break;
        case 37://left
          if (this.cellInfo.columnIndex > 0) {
            this.cellInfo.columnIndex--;
            // this.cellInfo.rowIndex = -1;
          }
          break;
        case 40://down 
          if (this.cellInfo.rowIndex < this.dataGrid.instance.totalCount() - 1) {
            this.cellInfo.rowIndex++;
            let container: any = $(this.rootNode.nativeElement).find("#gridContainerReport .dx-row .dx-data-row");
            container.css({ 'background-color': '#FFF1A8', 'color': 'black' });
            this.focusOnGrid();
          }
          break;
      }
    }
  }

  private focusOnGrid() {
    let targetCell: any = this.dataGrid.instance.getCellElement(this.cellInfo.rowIndex, this.cellInfo.columnIndex);
    this.dataGrid.instance.focus(targetCell);
  }

  windowKeyUpEvent(e) {
    if (this.cellInfo.rowIndex == -1) {
      let container: any;
      switch (e.keyCode) {
        case 9://Tab
          e.preventDefault();
          break;
        case 37://left
          if (this.cellInfo.columnIndex > 0) {
            this.cellInfo.columnIndex--;
            // this.cellInfo.rowIndex = -1;
            container = $(this.rootNode.nativeElement).find('#gridContainerReport .dx-texteditor-input')[this.cellInfo.columnIndex];
            container.focus();
          }
          break;
        case 39://right
          if (this.cellInfo.columnIndex < this.details.columnForDisplay.length - 1) {
            this.cellInfo.columnIndex++;
            container = $(this.rootNode.nativeElement).find('#gridContainerReport .dx-texteditor-input')[this.cellInfo.columnIndex];
            container.focus();
          }
          break;
        case 8:// Backspace
        case 38:// Up
        case 40:// Down
        case 46:// Delete
        case 79://'O' key
          break;
        default:
          // this.tepmWait = false;
          // this.wait();
          break;
      }
    }
  }

  private jsonData() {
    return [
      {
        "get-collecti-on-details": {
          columnForDisplay: [
            {
              dataField: 'EmployeeName',
              caption: 'Employee',
              width: '10%'
            },
            {
              dataField: 'PatCode',
              caption: 'Pat Code',
              width: '10%'
            },
            {
              dataField: 'PatientName',
              caption: 'Patient',
              width: '15%'
            },
            {
              dataField: 'BillCode',
              caption: 'Bill Code',
              width: '10%'
            },
            {
              dataField: 'BillDate',
              caption: 'Date',
              width: '10%'
            },
            {
              dataField: 'Purpose',
              caption: 'Purpose',
              width: '20%'
            },
            {
              dataField: 'TotalAmount',
              caption: 'Total',
              width: '5%'
            },
            {
              dataField: 'AoountPaid',
              caption: 'Paid',
              width: '5%'
            },
            {
              dataField: 'AmountDue',
              caption: 'Due',
              width: '5%'
            },
            {
              dataField: 'ConsessionAmount',
              caption: 'Consession',
              width: '5%'
            },
            {
              dataField: 'ModeofPayment',
              caption: 'Mode',
              width: '5%'
            }
          ],
          primaryKey: "BillCode",
          exportFileName: "BillDetails",
          path: "/API/GetCollectionDetails",
          requestType: "POST",
          heading: "Collection On Details"
        },
        "get-appointment-details": {
          columnForDisplay: [
            {
              dataField: 'PatCode',
              caption: 'Pat Code',
              width: '15%'
            },
            {
              dataField: 'AppointmentCode',
              caption: 'Appointment Code',
              width: '15%'
            },
            {
              dataField: 'PatientName',
              caption: 'Patient Name',
              width: '15%'
            },
            {
              dataField: 'Contact',
              caption: 'Contact',
              width: '10%'
            },
            {
              dataField: 'DoctorName',
              caption: 'Doctor Name',
              width: '15%'
            },
            {
              dataField: 'AppointmentTime',
              caption: 'Time',
              width: '15%'
            },
            {
              dataField: 'IsConfirmed',
              caption: 'IsConfirmed',
              width: '5%'
            },
            {
              dataField: 'IsAttented',
              caption: 'IsAttented',
              width: '5%'
            },
            {
              dataField: 'IsCanceled',
              caption: 'IsCanceled',
              width: '5%'
            }
          ],
          primaryKey: "AppointmentCode",
          exportFileName: "AppointmentDetails",
          path: "/API/GetAppointmentDetails",
          requestType: "GET",
          heading: "Appointment Details"
        },
        "get-examination-details": {
          columnForDisplay: [
            {
              dataField: 'PatCode',
              caption: 'Pat Code',
              width: '25%'
            },
            {
              dataField: 'ExaminationCode',
              caption: 'Examination Code',
              width: '25%'
            },
            {
              dataField: 'PatientName',
              caption: 'Patient',
              width: '25%'
            },
            {
              dataField: 'Contact',
              caption: 'Contact',
              width: '5%'
            },
            {
              dataField: 'ExaminationName',
              caption: 'Name',
              width: '5%'
            },
            {
              dataField: 'ExaminationTime',
              caption: 'Time',
              width: '10%'
            },
            {
              dataField: 'IsCompleted',
              caption: 'IsCompleted',
              width: '5%'
            }
          ],
          primaryKey: "ExaminationCode",
          exportFileName: "ExaminationDetails",
          path: "/API/GetExaminationDetails",
          requestType: "POST",
          heading: "Examination Details"
        },
        "get-operation-details": {
          columnForDisplay: [
            {
              dataField: 'PatCode',
              caption: 'Pat Code',
              width: '15%'
            },
            {
              dataField: 'Contact',
              caption: 'Contact',
              width: '10%'
            },
            {
              dataField: 'OperationCode',
              caption: 'Operation Code',
              width: '15%'
            },
            {
              dataField: 'PatientName',
              caption: 'Patient',
              width: '10%'
            },
            {
              dataField: 'RefferedBy',
              caption: 'RefferedBy',
              width: '10%'
            },
            {
              dataField: 'RefferedTo',
              caption: 'RefferedTo',
              width: '10%'
            },
            {
              dataField: 'SurgeryName',
              caption: 'Surgery Name',
              width: '10%'
            },
            {
              dataField: 'SurgerySubName',
              caption: 'Surgery SubName',
              width: '10%'
            },
            {
              dataField: 'Eye',
              caption: 'Eye',
              width: '10%'
            }
          ],
          primaryKey: "OperationCode",
          exportFileName: "OperationDetails",
          path: "/API/GetOperationDetails",
          requestType: "POST",
          heading: "Operation Details"
        },
        "get-operation-successRate": {
          columnForDisplay: [
            {
              dataField: 'DoctorName',
              caption: 'Doctor Name',
              width: '25%'
            },
            {
              dataField: 'RefferedOperation',
              caption: 'Reffered Operation',
              width: '25%'
            },
            {
              dataField: 'ConvertedOperation',
              caption: 'Converted Operation',
              width: '25%'
            },
            {
              dataField: 'SuccessRate',
              caption: 'Success Rate',
              width: '25%'
            }
          ],
          primaryKey: "DoctorName",
          exportFileName: "OperationSuccessRate",
          path: "/API/GetOperationSuccessRate",
          requestType: "POST",
          heading: "Opertion Success Rate"
        },
        "get-treatement-details": {
          columnForDisplay: [
            {
              dataField: 'TreatmentCode',
              caption: 'Treatment Code',
              width: '10%'
            },
            {
              dataField: 'DoctorName',
              caption: 'Doctor Name',
              width: '10%'
            },
            {
              dataField: 'PatientName',
              caption: 'Patient Name',
              width: '10%'
            },
            {
              dataField: 'PatCode',
              caption: 'PatCode',
              width: '10%'
            },
            {
              dataField: 'Contact',
              caption: 'Contact',
              width: '10%'
            },
            {
              dataField: 'CheifComplain',
              caption: 'Cheif Complain',
              width: '10%'
            },
            {
              dataField: 'Disease',
              caption: 'Disease',
              width: '10%'
            },
            {
              dataField: 'Advice',
              caption: 'Advice',
              width: '10%'
            },
            {
              dataField: 'RefferedDoctorName',
              caption: 'Reffered Doc Name',
              width: '5%'
            },
            {
              dataField: 'IsRefferedToTest',
              caption: 'IsRefferedToTest',
              width: '5%'
            },
            {
              dataField: 'TreatmentDate',
              caption: 'Treatment Date',
              width: '10%'
            }
          ],
          primaryKey: "TreatmentCode",
          exportFileName: "TreatmentDetails",
          path: "/API/GetTreatementDetails",
          requestType: "POST",
          heading: "Treatment Details"
        }
      }
    ];
  }

  private test1(body) {
    let headers = new Headers({
      "Content-Type": "application/json",
      "Accept": "application/json"
    });
    // let options = new RequestOptions({ headers: headers });
    let options;
    // let url = "http://localhost/SecondSightAPI/API/GetCollectionDetails";
    let url = "http://localhost:53366/API/GetCollectionDetails";
    // let url = "http://localhost:54717/API/RegisterMaster";

    // let body = {
    //   // "TestMasterID": 2,
    //   "Test_Master_Name": "Test",
    //   "Test_Master_type": "3"
    // };

    // let body = {
    //   "EmployeeId": 2,
    //   "RoleId": 5
    // }

    this.http
      // .get(url)
      .post(url, body, options)
      .pipe(map(response => response.json()))
      .subscribe(d => {
        console.log(d);
        this.details.dataList = d;
        this.setDataSource();
      }, err => {
        console.log(err)
      });
  }

  private loadData() {
  }

}
