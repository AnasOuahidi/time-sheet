import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepicker } from '@angular/material/datepicker';

import * as _moment from 'moment';
import { default as _rollupMoment, Moment } from 'moment';
import { Subscription } from 'rxjs';
import { AppService } from './app.service';

const moment = _rollupMoment || _moment;

const html2pdf = require('html2pdf.js');

export const MY_FORMATS = {
  parse: {
    dateInput: 'YYYY-MM'
  },
  display: {
    dateInput: 'MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY'
  }
};

@Component({
  selector: 'ts-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },

    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS}
  ]
})
export class AppComponent implements OnInit, OnDestroy {
  constructor (private App: AppService) {}

  private holidaysSubscription: Subscription;

  header: {
    employeeName: string,
    employeeEmail: string,
    companyName: string,
    managerName: string,
    managerEmail: string
  } = {
    employeeName: '',
    employeeEmail: '',
    companyName: '',
    managerName: '',
    managerEmail: ''
  };
  today: string;
  month: FormControl;
  dates: { dayName: string, dayDate: string, isWeekEnd: boolean, isHoliday: boolean, activity?: string }[];
  monthName: string;
  year: string;
  total: number;
  isPdf: boolean = false;
  holidays: string[];

  @ViewChild('pdfTable', {static: false}) pdfTable: ElementRef;

  ngOnInit () {
    this.today = moment().format('DD/MM/YYYY HH:mm:ss');
    this.month = new FormControl(moment());
    this.year = this.month.value.format('YYYY');
    this.holidaysSubscription = this.App.getHolidays(this.year).subscribe((holidays: { date: string, nom_jour_ferie: string }[]) => {
      this.holidays = holidays.map((holiday: { date: string, nom_jour_ferie: string }) => holiday.date);
      this.validate();
    });
  }

  ngOnDestroy (): void {
    if (this.holidaysSubscription) {
      this.holidaysSubscription.unsubscribe();
    }
  }

  chosenYearHandler (normalizedYear: Moment) {
    const ctrlValue = this.month.value;
    const year = normalizedYear.year();
    if (`${year}` !== this.year) {
      this.holidaysSubscription = this.App.getHolidays(`${year}`).subscribe((holidays: { date: string, nom_jour_ferie: string }[]) => {
        this.holidays = holidays.map((holiday: { date: string, nom_jour_ferie: string }) => holiday.date);
      });
    }
    ctrlValue.year(year);
    this.month.setValue(ctrlValue);
  }

  chosenMonthHandler (normalizedMonth: Moment, datepicker: MatDatepicker<Moment>) {
    const ctrlValue = this.month.value;
    ctrlValue.month(normalizedMonth.month());
    this.month.setValue(ctrlValue);
    datepicker.close();
    this.validate();
  }

  validate () {
    const month = this.month.value.format('MM');
    const year = this.month.value.format('YYYY');
    this.monthName = this.month.value.format('MMMM');
    this.year = year;
    const start = moment(`${year}-${month}-01`);
    const end = start.clone();
    end.add(1, 'months');
    const dates: { dayName: string, dayDate: string, isWeekEnd: boolean, isHoliday: boolean, activity?: string }[] = [];

    for (let m = moment(start); m.isBefore(end); m.add(1, 'days')) {
      const day = m.weekday();
      const date = m.format('YYYY-MM-DD');
      const isHoliday = this.holidays.indexOf(date) !== -1;
      dates.push({
        dayDate: m.format('DD'),
        dayName: m.format('dd'),
        isWeekEnd: (day === 6) || (day === 0),
        isHoliday
      });
    }
    this.dates = dates;
  }

  checkAll () {
    this.total = 0;
    for (const date of this.dates) {
      if (!date.isWeekEnd && !date.isHoliday) {
        date.activity = '0.5';
        this.total+= 0.5;
      }
    }
  }

  calculateTotal () {
    this.total = 0;
    for (const date of this.dates) {
      if (!date.isWeekEnd && !date.isHoliday && !!date.activity) {
        this.total += parseFloat(date.activity);
      }
    }
  }

  showPdf () {
    this.isPdf = true;
  }

  generatePdf () {
    const pdfTable = this.pdfTable.nativeElement;
    const opt = {
      margin: 0,
      filename: `CRA ${this.monthName} ${this.year}.pdf`,
      image: {type: 'jpeg', quality: 0.98},
      html2canvas: {scale: 2.5},
      jsPDF: {unit: 'in', format: 'letter', orientation: 'landscape'}
    };
    html2pdf().set(opt).from(pdfTable).save();
  }

  goBack () {
    this.isPdf = false;
  }
}
