
module.exports = function DataSeries(seriesName, color) {
  
  if (!this instanceof DataSeries)
    return new DataSeries(seriesName, color);
  
  let _x_series = [], _y_series = [];
  let _zippedData = [];
  let _bindings = [];
  
  let updateBindings = function(x, y, append) {
    _bindings.map(function(binding) {
      binding.binding(x, y, append);
    })
  };
  
  let updateZip = function() {
    
    //Zips the two arrays into a collection of json objects with the format { x: 0.0, y: 1.0 }
    if (_x_series.length < _y_series) {
      _zippedData = _x_series.map(function(e, i) {
        return {x: _x_series[i], y: _y_series[i]};
      });
    } else {
      _zippedData = _y_series.map(function(e, i) {
        return {x: _x_series[i], y: _y_series[i]};
      })
    }
    
  };
  
  this.x = function(xSeries) {
    if (xSeries === undefined)
      return _x_series;
    
    _x_series = xSeries;
    updateZip();
    updateBindings(_x_series, _y_series);
    return this;
  };
  
  this.y = function(ySeries) {
    if (ySeries === undefined)
      return _y_series;
    
    _y_series = ySeries;
    updateZip();
    updateBindings(_x_series, _y_series);
    return this;
  };
  
  var _intervals = 1;
  var _domain = [0, 0];
  var _func = undefined;
  
  var generate = function() {
    
    _x_series = [_domain[0]];
    
    var step = _domain[1] - _domain[0];
    step /= _intervals;
    
    for (var i = 0; i < _intervals; ++i) {
      _x_series.push(_domain[0] + i * step);
    }
    
    _y_series = _x_series.map(_func);
    
    updateZip();
    
  };
  
  this.interpolate = function(x) {
    //It's out the bounds of this series just skip it
    if (x < _x_series[0] || x > _x_series[_x_series.length - 1])
      return undefined;
    
    //Binary search (similar type of thing)
    //Used to find the appropriate interval for interpolation
    var index = _x_series.length / 2;
    var splice = 0;
    var iters = 0;
    while(true) {
      
      ++iters;
      if (x >= _x_series[index]) {
        if (x < _x_series[index + 1])
        //We've found the appropriate interval
          break;
        
        splice = index;
        index = index + (_x_series.length - index) / 2;
        
      } else {
        if (x > _x_series[index - 1]) {
          //The left interval is appropriate, decrement then break
          --index;
          break;
        }
        index = index - (index - splice) / 2; //Go to the left half of the array
        
      }
      
      if (Math.floor(index) == 0)
        break;
      index = Math.round(index);
      
      if (index == _x_series.length) {
        --index;
        break;
      }
    }
    
    // Use the index for the appropriate interval to interpolate the y value
    var slope = (_y_series[index + 1] - _y_series[index]) / (_x_series[index + 1] - _x_series[index]);
    
    var d_x = x - _x_series[index];
    
    return _y_series[index] + slope * d_x;
    
  };
  
  this.map = {
    domain: function(begin, end) {
      
      if (begin === undefined)
        return _domain;
      _domain = [begin, end];
      
      if (_intervals > 1 && !(_func === undefined)) {
        //Generate _x_series
        generate();
      }
      
      return this;
    },
    intervals: function(n) {
      if (n === undefined)
        return _intervals;
      
      if (_domain != [0,0] && !(_func === undefined))
        generate();
      
      _intervals = n;
      
      return this;
    },
    f: function(func) {
      _func = func;
      
      if (!_domain.equals([0,0]) && !(_intervals == 1))
        generate();
      
      return this;
    }
  };
  
  this.detail = {
    //Func is a function that takes an array of new x and a boolean indicating whether the data's been appended or is new
    addBinding: function(series, func) {
      _bindings.push({
        seriesName: series,
        binding: func
      });
    },
    removeBinding: function(series) {
      _bindings.filter(function (binding) {
        return binding.seriesName != binding;
      });
    }
  };
  
  //Binds the series to another series by some function (Could for instance take the logarithm of a series this way)
  //More efficient
  this.bind = function(series, func) {
    // We need to populate the x and y series of this given the initial series being referenced
    
    var seriesObject = undefined;
    if (series in _series) {
      seriesObject = _series[series];
    }
    
    _x_series = seriesObject.x();
    _y_series = seriesObject.y().map(func);
    
    seriesObject.detail.addBinding(seriesName, function(x, y, append) {
      
      if (!(x instanceof Array))
        x = [x];
      if (!(y instanceof Array))
        y = [y];
      
      //Calculate the y_s using the ys of the other series
      var y_s = y.map(func);
      
      if (append) {
        _x_series = _x_series.concat(x);
        _y_series = _y_series.concat(y_s);
      }
      else {
        _x_series = x;
        _y_series = y_s;
      }
      
      updateZip();
      
    });
    
    return this;
    
  };
  
  /*this.bind = function() {
   
   //It is assumed that the x values for all these series are the same
   //TODO: implement interpolation algorithm to avoid this assumption
   
   var bindingFunc = undefined;
   var seriesNames = [];
   
   //Get series names as the first leading arguments then the function to call
   for (var i = 0; i < arguments.length; ++i) {
   var obj = arguments[i];
   if (obj instanceof Function) {
   bindingFunc = obj;
   break;
   } else {
   seriesNames.push(obj);
   }
   }
   
   var leadingSeries = seriesNames.shift();
   
   var y_buffers = {};
   
   var dataSeriesObject = _series[leadingSeries];
   
   _x_series = dataSeriesObject.x();
   
   for (i = 0; i < seriesNames.length; ++i) {
   
   }
   
   dataSeriesObject.detail.addBinding(seriesName, function(x, y, append) {
   
   if (!(x instanceof Array))
   x = [x];
   if (!(x instanceof Array))
   y = [y];
   
   if (append)
   _x_series = _x_series.concat(x);
   else
   _x_series = x;
   
   });
   
   }; */
  
  this.append = {
    x: function(x) {
      
      var lengthBefore = _x_series.length;
      _x_series = _x_series.concat(x);
      var lengthAfter = _x_series.length;
      
      updateZip();
      
      //We can send some data to the binding since there's enough y values
      if (_y_series.length > lengthBefore) {
        
        //Take the minimum of the lengths of the two sub arrays to see how much to send to the bound series
        var amount = d3.min(
          [lengthAfter - lengthBefore, _y_series.length - lengthBefore]
        );
        
        //Get the last [amount] elements of the arrays
        var x_s = _x_series.slice(-amount);
        var y_s = _y_series.slice(-amount);
        
        updateBindings(x_s, y_s, true);
        
      }
      
      return this;
    },
    y: function(y) {
      var lengthBefore = _y_series.length;
      _y_series = _y_series.concat(y);
      var lengthAfter = _y_series.length;
      
      updateZip();
      
      if (_y_series.length > lengthBefore) {
        //We can send some data to the binding since there's enough x values
        
        //Take the minimum of the lengths of the two sub arrays to see how much to send to the bound series
        var amount = d3.min(
          [lengthAfter - lengthBefore, _y_series.length - lengthBefore]
        );
        
        //Get the last [amount] elements of the arrays
        var x_s = _x_series.slice(-amount);
        var y_s = _y_series.slice(-amount);
        
        updateBindings(x_s, y_s, true);
        
      }
      
      return this;
    }
  };
  
  this.zip = function() { return _zippedData; };
  
  this.tooltipGroup = _svg.append('g')
    .attr('class', 'graph-tooltip-selection');
  
  this.tooltipCircle = this.tooltipGroup.append('circle')
    .attr('fill', 'black');
  
  if (!(color === undefined))
    this.tooltipCircle.attr('fill', color);
  
};
