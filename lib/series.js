
import {min} from 'd3';
const d3 = {min};
const Interval = require('./interval');

class SeriesMap {

  constructor(readyCallback) {
    this._domain = new Interval();
    this._intervals = 1;
    this._func = undefined;

    this._ready = readyCallback;
  }

  ifReady() {
    if (this._func !== undefined && this._intervals > 1 && !this._domain.equals([0, 0]))
      this._ready();
  }


  domain(begin, end) {
    if (begin === undefined)
      return this._domain;

    this._domain = new Interval(begin, end);

    this.ifReady();

  }

  intervals(n) {
    if (n === undefined)
      return this._intervals;

    this._intervals = n;

    this.ifReady();

  }

  f(func) {
    if (func === undefined)
      return this._func;

    this._func = func;

    this.ifReady();

  }

}

class DataSeries {

  name() {
    return this._name;
  }

  constructor(seriesName) {
    this._x_series = [];
    this._y_series = [];
    this._zippedData = [];
    this._bindings = [];
    this._name = seriesName;
    this.map = new SeriesMap(this.generate);
    this.append = function(parent) {
      return {
        x: function(x) {

          let lengthBefore = parent._x_series.length;
          parent._x_series = parent._x_series.concat(x);
          let lengthAfter = parent._x_series.length;

          parent.updateZip();

          //We can send some data to the binding since there's enough y values
          if (parent._y_series.length > lengthBefore) {

            //Take the minimum of the lengths of the two sub arrays to see how much to send to the bound series
            let amount = d3.min(
              [lengthAfter - lengthBefore, parent._y_series.length - lengthBefore]
            );

            //Get the last [amount] elements of the arrays
            let x_s = parent._x_series.slice(-amount);
            let y_s = parent._y_series.slice(-amount);

            parent.updateBindings(x_s, y_s, true);

          }

          return this;
        },
        y: function(y) {
          let lengthBefore = parent._y_series.length;
          parent._y_series = parent._y_series.concat(y);
          let lengthAfter = parent._y_series.length;

          parent.updateZip();

          if (parent._y_series.length > lengthBefore) {
            //We can send some data to the binding since there's enough x values

            //Take the minimum of the lengths of the two sub arrays to see how much to send to the bound series
            let amount = d3.min(
              [lengthAfter - lengthBefore, parent._y_series.length - lengthBefore]
            );

            //Get the last [amount] elements of the arrays
            let x_s = parent._x_series.slice(-amount);
            let y_s = parent._y_series.slice(-amount);

            parent.updateBindings(x_s, y_s, true);

          }

          return this;
        }
      }
    }(this);
  }

  updateBindings(x, y, append) {
    this._bindings.map((binding) => binding.binding(x, y, append));
  }

  updateZip() {
    if (this._x_series.length < this._y_series.length) {
      this._zippedData = this._x_series.map((e, i) => {
        return {
          x: this._x_series[i],
          y: this._y_series[i]
        }
      });
    } else {
      this._zippedData = this._y_series.map((e, i) => { return {
          x: this._x_series[i], y: this._y_series[i]
        }
      });
    }

  }

  generate() {

    let domain = this.map.domain();
    let intervals = this.map.intervals();
    let func = this.map.f();

    this._x_series = [domain.leftBound()];

    let step = domain.intervalLength();
    step /= intervals;

    for (let i = 0; i < intervals; ++i) {
      this._x_series.push(domain[0] + i * step);
    }

    this._y_series = this._x_series.map(func);

    this.updateZip();

  }

  x(xSeries) {
    if (xSeries === undefined)
      return this._x_series;

    this._x_series = xSeries;
    this.updateZip();
    this.updateBindings(this._x_series, this._y_series);
    return this;
  }

  y(ySeries) {
    if (ySeries === undefined)
      return this._y_series;

    this._y_series = ySeries;
    this.updateZip();
    this.updateBindings(this._x_series, this._y_series);
    return this;
  }

  interpolate(x) {
    //It's out the bounds of this series just skip it
    if (x < this._x_series[0] || x > this._x_series[this._x_series.length - 1])
      return undefined;

    //Binary search (similar type of thing)
    //Used to find the appropriate interval for interpolation
    let index = this._x_series.length / 2;
    let splice = 0;
    let iters = 0;
    while(true) {

      ++iters;
      if (x >= this._x_series[index]) {
        if (x < this._x_series[index + 1])
        //We've found the appropriate interval
          break;

        splice = index;
        index = index + (this._x_series.length - index) / 2;

      } else {
        if (x > this._x_series[index - 1]) {
          //The left interval is appropriate, decrement then break
          --index;
          break;
        }
        index = index - (index - splice) / 2; //Go to the left half of the array

      }

      if (Math.floor(index) == 0)
        break;
      index = Math.round(index);

      if (index == this._x_series.length) {
        --index;
        break;
      }
    }

    // Use the index for the appropriate interval to interpolate the y value
    let slope = (this._y_series[index + 1] - this._y_series[index]) / (this._x_series[index + 1] - this._x_series[index]);

    let d_x = x - this._x_series[index];

    return this._y_series[index] + slope * d_x;

  };

  addBinding(series, func) {
    this._bindings.push({
      seriesName: series,
      binding: func
    })
  }

  removeBinding(series) {
    this._bindings.filter((binding) => binding.seriesName != series)
  }

  bind(seriesObject, func) {
    // We need to populate the x and y series of this given the initial series being referenced
    
    this._x_series = seriesObject.x();
    this._y_series = seriesObject.y().map(func);

    seriesObject.addBinding(this.seriesName, (x, y, append) => {

      if (!(x instanceof Array))
        x = [x];
      if (!(y instanceof Array))
        y = [y];

      //Calculate the y_s using the ys of the other series
      let y_s = y.map(func);

      if (append) {
        this._x_series = this._x_series.concat(x);
        this._y_series = this._y_series.concat(y_s);
      }
      else {
        this._x_series = x;
        this._y_series = y_s;
      }

      this.updateZip();

    });

    return this;
  }

  //Function is self calling so as to create an object with the proper context bound to this
  zip() {
    return this._zippedData;
  }

}

module.exports = DataSeries;
