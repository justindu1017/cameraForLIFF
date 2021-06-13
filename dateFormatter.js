module.exports = class dateFormatter {
  constructor(date) {
    this.year = date.getFullYear();
    this.month = date.getMonth() + 1;
    this.date = date.getDate();
    this.hour = date.getHours();
    this.minute = date.getMinutes();
    this.second = date.getSeconds();
  }
  displayToDate() {
    return this.year + "-" + this.month + "-" + this.date;
  }
  displayToYear() {
    return this.year;
  }
  displayToMonth() {
    return this.year + "-" + this.month;
  }

  displayToSecond() {
    return (
      this.year +
      "-" +
      this.month +
      "-" +
      this.date +
      " " +
      this.hour +
      ":" +
      this.minute +
      ":" +
      this.second
    );
  }

  displayTohour() {
    return this.year + "-" + this.month + "-" + this.date + " " + this.hour;
  }

  displayToMinute() {
    return (
      this.year +
      "-" +
      this.month +
      "-" +
      this.date +
      " " +
      this.hour +
      ":" +
      this.minute
    );
  }
};
