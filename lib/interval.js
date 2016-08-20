/**
 * Created by gabriel on 18/08/16.
 */

import { min, max, extent } from 'd3';
let d3 = { min, max, extent };

export class Interval extends Array {

  constructor() {
    super();
    this.push(0);
    this.push(0);

    if (arguments[0] instanceof Array && arguments[0].length >= 2) {
      this[0] = arguments[0][0];
      this[1] = arguments[0][1];
    }
    else {

      if (arguments[0] !== undefined) {
        this.leftBound(arguments[0]);
      }
      if (arguments[1] !== undefined) {
        this.rightBound(right);
      }

    }

  }

  equals(array) {
    // if the other interval is a false value, return
    if (!array)
      return false;

    if (!(array instanceof Array))
      return false;

    if (array.length < 2)
      return false;

    return array[0] == this[0] && array[1] == this[1];

  };

  leftBound(left) {
    if (left === undefined) {
      return this[0];
    }
    else {
      this[0] = left;
    }
  }

  rightBound(right) {
    if (right === undefined) {
      return this[1];
    }
    else {
      this[1] = right;
    }
  }

  intervalLength() {
    return this.rightBound() - this.leftBound();
  }

  static fromSeries(series) {
    var bounds = d3.extent(series);
    return new Interval(bounds[0], bounds[1]);
  }

  static unionBounds(bound1, bound2) {

    //Takes the union of domains for different series of a line graph (in order to be used to find a common scale)
    var combined_list = bound1.concat(bound2);

    if (bound1.equals([0, 0]))
      return bound2;
    else if (bound2.equals([0, 0]))
      return bound1;

    var interval = new Interval();
    interval.leftBound(d3.min(combined_list));
    interval.rightBound(d3.max(combined_list));

    return interval;

  }

  static adjustDomain(bounds) {
    if (bounds[0] > 0)
      bounds[0] = 0;
    else if (bounds[1] < 0)
      bounds[1] = 0;
    return bounds;
  }

}

module.exports = Interval;