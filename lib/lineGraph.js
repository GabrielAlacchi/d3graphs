
// Warn if overriding existing method
if(Array.prototype.equals)
  console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
  // if the other array is a falsy value, return
  if (!array)
    return false;
  
  // compare lengths - can save a lot of time
  if (this.length != array.length)s
  return false;
  
  for (var i = 0, l=this.length; i < l; i++) {
    // Check if we have nested arrays
    if (this[i] instanceof Array && array[i] instanceof Array) {
      // recurse into the nested arrays
      if (!this[i].equals(array[i]))
        return false;
    }
    else if (this[i] != array[i]) {
      // Warning - two different object instances will never be equal: {x:20} != {x:20}
      return false;
    }
  }
  return true;
};

// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {enumerable: false});

function adjustDomain(bounds) {
  if (bounds[0] > 0)
    bounds[0] = 0;
  else if (bounds[1] < 0)
    bounds[1] = 0;
  return bounds;
}

function unionBounds(bound1, bound2) {
  
  //Takes the union of domains for different series of a line graph (in order to be used to find a common scale)
  var combined_list = bound1.concat(bound2);
  
  if (bound1.equals([0, 0]))
    return bound2;
  else if (bound2.equals([0, 0]))
    return bound1;
  
  return [
    d3.min(combined_list),
    d3.max(combined_list)
  ];
  
}

/* Exportation */

module.exports = function Line(id, title) {
  
  if (!this instanceof Line) return new Line(id, title);
  
  this._prevMouse = [-1, -1];
  this.line = d3.line()
    .x(function (d) { return this._xScale(d.x); })
    .y(function (d) { return this._yScale(d.y); });
  
  this._width = 0;
  this._height = 0;
  this._svg = d3.select('body').append('svg')
    .attr('id', id);
  
  // Title rendering
  this._titleGroup = this._svg.append('g')
    .attr('class', 'title-box');
  this._titleText = this._titleGroup.append('text');
  
  this._lineGroup = this._svg.append('g')
    .attr('class', 'graph-body')
    .style('z-index', '0');
  this._xGroup = this._svg.append('g')
    .attr('class', 'axis--x');
  this._yGroup = this._svg.append('g')
    .attr('class', 'axis--y');
  
  this._tooltip = d3.select("body")
    .append("div")
    .attr('class', 'graph-tooltip')
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden");
  
  this._xLabel = this._xGroup.append('text')
    .style('text-anchor', 'end')
    .attr('class', 'x-label')
    .attr('fill', '#000')
    .attr('x', '90%')
    .attr('dy', '-.71em')
    .text('');
  
  this._yLabel = this._yGroup.append('text')
    .attr('transform', 'rotate(-90)')
    .style('text-anchor', 'end')
    .attr('class', 'y-label')
    .attr('fill', '#000')
    .attr('y', 6)
    .attr('dy', '.71em')
    .text('');
  
  this._tooltip.append('p'); //For x coordinate output
  
  this._tooltip_visible = false;
  
  
  
  this._lineGroup
    .on("mouseover", function(){
      this._tooltip_visible = true;
      return setTooltipVisibility('visible');
    })
    .on("mousemove", function() {
      let coords = d3.mouse(this);
      this._tooltip.style("top",
        (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) +"px");
      return this.updateToolTip(coords);
    })
    .on("mouseout", function(){
      this._tooltip_visible = false;
      
      for (var seriesName in _series) {
        
        if (_series.hasOwnProperty(seriesName)) {
          let dataSeriesObject = _series[seriesName];
          dataSeriesObject.tooltipGroup.style('visibility', 'hidden');
        }
      }
      return this.setTooltipVisibility('hidden');
    })
    .append('rect')
    .attr('fill', 'white');
  
  this._xScale = d3.scaleLinear();
  this._yScale = d3.scaleLinear();
  
  this._xAxis = d3.axisBottom();
  this._yAxis = d3.axisLeft();
  
  this._rendered = false;
  this._zippedData = [];
  
  this._margin = { top: 50, right: 20, bottom: 30, left: 50 };
  
  //Self called with this
  
  //API looks like this.margin.top(50).bottom(30).left(10).right(20);
  this.margin = function(parent) {
    
    return {
      top: function (top) {
        parent._margin.top = top;
        parent.updateTransforms();
        return this;
      },
      right: function (right) {
        _margin.right = right;
        parent.updateTransforms();
        return this;
      },
      bottom: function (bottom) {
        _margin.bottom = bottom;
        updateTransforms();
        return this;
      },
      left: function (left) {
        _margin.left = left;
        updateTransforms();
        return this;
      },
      setAll: function ({ top = 50, right = 20, bottom = 30, left = 50 }) {
        parent._margin.top = top;
        parent._margin.right = right;
        parent._margin.left = left;
        parent._margin.bottom = bottom;
        parent.updateTransforms();
        return this;
      }
    }
  }(this);
  
  this._includeOrigin = false;
  
  this.height = function(height) {
    
    if (height === undefined)
      return this._height;
    
    //Assume we're dealing with percentages
    if (typeof height == 'string' || height instanceof String) {
      height = height.trim();
      if (height[height.length - 1] == '%') {
        var percentage = parseFloat(height);
        var w = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        height = percentage * w / 100.0;
      } else {
        height = parseFloat(height);
      }
    }
    
    this._svg.attr('height', height);
    this._height = height;
    this._lineGroup
      .attr('transform', 'translate(' + _width * 0.05 + ',' + _height * 0.05 + ')');
    updateTransforms();
    return this;
  };
  
  var _series = {};
  
  function DataSeries(seriesName, color) {
    
    var _x_series = [], _y_series = [];
    var _zippedData = [];
    var _bindings = [];
    
    var updateBindings = function(x, y, append) {
      _bindings.map(function(binding) {
        binding.binding(x, y, append);
      })
    };
    
    var updateZip = function() {
      
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
    
    var path = _lineGroup.append('path')
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke', '#000')
      .attr('stroke-width', '10');
    if (!(color === undefined)) {
      path.attr('stroke', color);
    }
    
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
    
  }
  
  //Gets or returns the data object for the series name
  this.data = function(seriesName, color) {
    
    //Can be used as a getter for all the data series currently on the graph
    if (seriesName === undefined) {
      return _series;
    }
    
    if (seriesName in _series) {
      //The series already exists just use it as a getter
      return _series[seriesName];
    }
    
    var series = new DataSeries(seriesName, color);
    
    //Add a line to the tooltip
    _tooltip.append('p');
    
    _series[seriesName] = series;
    return series;
    
  };
  
  var updateAxes = function() {
    
    _xAxis
      .scale(_xScale);
    _yAxis
      .scale(_yScale);
    
    _xGroup
      .call(_xAxis);
    _yGroup
      .call(_yAxis);
  };
  
  //SELF CALLING FUNCTION
  this.axis = function(parent) {
    return {
      x: {
        label: function(text) {
          if (text === undefined)
            return parent._xLabel.text();
          
          parent._xLabel.text(text);
          return this;
        },
        ticks: function(ticks) {
          if (ticks === undefined)
            return parent._xAxis.ticks();
          
          parent._xAxis.ticks(ticks);
          return this;
        }
      },
      y: {
        label: function(text) {
          if (text === undefined)
            return parent._yLabel.text();
          
          parent._yLabel.text(text);
          return this;
        },
        ticks: function(ticks) {
          if (ticks === undefined)
            return parent._yAxis.ticks();
          
          parent._yAxis.ticks(ticks);
          return this;
        }
      }
    }
  }(this);
  
  this.updateTransforms();
  
  return this;
  
}

Line.prototype.updateTransforms = function() {
  
  // Get the origin position on screen for the axes to be translated there
  var x0, y0;
  x0 = this._xScale(0);
  y0 = this._yScale(0);
  
  var xRange = this._xScale.range().sort(d3.ascending);
  var yRange = this._yScale.range().sort(d3.ascending);
  
  if (x0 < xRange[0] || x0 > xRange[1])
    x0 = 0;
  
  if (y0 < yRange[0] || y0 > yRange[1])
    y0 = yRange[1];
  
  // Destructuring
  let {_width, _height, _margin } = this;
  let { left, right, top, bottom } = _margin;
  
  this._svg
    .attr('width', _width + left + right)
    .attr('height', _height + top + bottom);
  
  this._titleGroup
    .attr('transform', 'translate(' + (_margin.left + 0.5 * _width) + ',' + 0.8 * _margin.top + ')');
  this._lineGroup
    .attr('transform', 'translate(' + _margin.left + ',' + _margin.top + ')')
    .style('z-index', '0');
  
  this._lineGroup.select('rect')
    .attr('width', _width)
    .attr('height', _height);
  
  this._xGroup
    .attr('transform', 'translate(' + _margin.left + ',' + (y0 + _margin.top) + ')');
  this._yGroup
    .attr('transform', 'translate(' + (x0 + _margin.left) + ', ' + _margin.top + ')');
  
};

Line.prototype.interpolateMouse = function(coords) {
  
  //Calculate the value for each series by interpolating between the current interval
  const mouse_x = coords.x;
  
  const valuesOfSeries = [];
  
  //Get the value of x in the data space
  let x = this._xScale.invert(mouse_x);
  
  for (var key in this._series) {
    if (this._series.hasOwnProperty(key)) {
      //Looping through every series name using hasOwnProperty
      //Do a binary search operation to find the appropriate interval for this x value in the data space
      //Then interpolate using the given x value (y = mx + b)
      var seriesObj = this._series[key];
      
      var value = seriesObj.interpolate(x);
      if (value === undefined)
        continue;
      
      valuesOfSeries.push({
        series: key,
        value: value
      });
      
    }
  }
  return valuesOfSeries;
  
};

Line.prototype.update = function() {
  //Initialize to an empty domain
  let xExtent = [0, 0];
  let yExtent = [0, 0];
  
  let data = [];
  for (let key in _series) {
    let series = _series[key];
    let xSeriesExt = d3.extent(series.x());
    let ySeriesExt = d3.extent(series.y());
    
    xExtent = unionBounds(xExtent, xSeriesExt);
    yExtent = unionBounds(yExtent, ySeriesExt);
    
    data.push(series.zip());
    
  }
  
  //Adjust the bounds to include 0 in the scale domains
  if (this._includeOrigin) {
    xExtent = adjustDomain(xExtent);
    yExtent = adjustDomain(yExtent);
  }
  
  this._xScale
    .domain(xExtent)
    .range([0, this._width]);
  
  this._yScale
    .domain(yExtent)
    .range([this._height, 0]);
  
  this.updateTransforms();
  
  this._lineGroup.selectAll('path')
    .data(data)
    .attr('d', line);
  
  this._titleText
    .text(title);
  
  updateAxes();
  
  if (_tooltip_visible)
    updateToolTip(this._prevMouse);
  
};

Line.prototype.includeOrigin = function(val) {
  if (val === undefined)
    return this._includeOrigin;
  
  this._includeOrigin = val;
  return this;
};

Line.prototype.width = function(width) {
  
  if (width === undefined)
    return this._width;
  
  //Assume we're dealing with percentages
  if (typeof width == 'string' || width instanceof String) {
    
    width = width.trim();
    if (width[width.length - 1] == '%') {
      var percentage = parseFloat(width);
      var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      width = percentage * w / 100.0;
    } else {
      width = parseFloat(width);
    }
  }
  
  this._svg.attr('width', width);
  this._width = width;
  this._lineGroup
    .attr('transform', 'translate(' + this._width * 0.05 + ',' + this._height * 0.05 + ')');
  this.updateTransforms();
  return this;
};

Line.prototype.setTooltipVisibility = function(value) {
  return this._tooltip.style("visibility", value);
};

Line.prototype.updateToolTip = function(coords) {
  
  const valuesOfSeries = interpolateMouse({ x: coords[0], y: coords[0] });
  
  let data = [{ series: 'x', value: _xScale.invert(coords[0]) }]
    .concat(valuesOfSeries);
  
  this._tooltip.selectAll('p')
    .data(data)
    .text(function(d) {
      return d.series + ": " + d.value.toPrecision(3);
    })
    .style('visibility', 'inherit')
    .exit()
    .style('visibility', 'hidden')
    .text('');
  
  for (let i = 0; i < valuesOfSeries.length; ++i) {
    let dataSeriesObject = _series[valuesOfSeries[i].series];
    
    let dx, dy;
    dx = _margin.left + coords[0];
    dy = _margin.top + _yScale(valuesOfSeries[i].value);
    
    if (isNaN(dy)) {
      continue;
    }
    
    dataSeriesObject.tooltipGroup
      .attr('transform', 'translate(' + dx + ',' + dy + ')')
      .style('visibility', 'visible');
    
    
    dataSeriesObject.tooltipCircle
      .attr('r', this._width / 100.0);
    
  }
  
  this._prevMouse = coords;
  return this._tooltip;
};