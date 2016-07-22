/**
 * Created by gabriel on 17/07/16.
 */

// Warn if overriding existing method
if(Array.prototype.equals)
    console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (this.length != array.length)
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

d3graphs = {

    line: function(id, title) {

        function LineGraphObject(id, title) {

            var _prevMouse = [-1, -1];
            var line = d3.line()
                .x(function (d) { return _xScale(d.x); })
                .y(function (d) { return _yScale(d.y); });

            var _width = 0, _height = 0;
            var _svg = d3.select('body').append('svg')
                .attr('id', id);

            // Title rendering
            var _titleGroup = _svg.append('g')
                .attr('class', 'title-box');
            var _titleText = _titleGroup.append('text');


            var _lineGroup = _svg.append('g')
                .attr('class', 'graph-body');
            var _xGroup = _svg.append('g')
                .attr('class', 'axis--x');
            var _yGroup = _svg.append('g')
                .attr('class', 'axis--y');

            var _tooltip = d3.select("body")
                .append("div")
                .attr('class', 'graph-tooltip')
                .style("position", "absolute")
                .style("z-index", "10")
                .style("visibility", "hidden");

            _tooltip.append('p'); //For x coordinate output

            var _tooltip_visible = false;
            var setTooltipVisibility = function(value) {
                return _tooltip.style("visibility", value);
            };

            var updateToolTip = function(coords) {
                var valuesOfSeries = interpolateMouse({ x: coords[0], y: coords[0] });

                var data = [{ series: 'x', value: coords[0] }]
                    .concat(valuesOfSeries);

                _tooltip.selectAll('p')
                    .data(data)
                    .text(function(d) {
                        return d.series + ": " + d.value.toPrecision(3);
                    })
                    .style('visibility', 'inherit')
                    .exit()
                    .style('visibility', 'hidden')
                    .text('');

                for (var i = 0; i < valuesOfSeries.length; ++i) {
                    var dataSeriesObject = _series[valuesOfSeries[i].series];

                    dataSeriesObject.tooltipGroup
                        .attr('transform', 'translate(' + (_margin.left + coords[0]) + ',' + (_margin.top + _yScale(valuesOfSeries[i].value)) + ')')
                        .style('visibility', 'visible');

                    dataSeriesObject.tooltipCircle
                        .attr('r', _width / 100.0);

                }

                _prevMouse = coords;
                return _tooltip;
            };

            _lineGroup
                .on("mouseover", function(){
                    _tooltip_visible = true;
                    return setTooltipVisibility('visible');
                })
                .on("mousemove", function() {
                    var coords = d3.mouse(this);
                    _tooltip.style("top",
                        (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) +"px");

                    return updateToolTip(coords);
                })
                .on("mouseout", function(){
                    _tooltip_visible = false;

                    for (var seriesName in _series) {

                        if (_series.hasOwnProperty(seriesName)) {
                            var dataSeriesObject = _series[seriesName];
                            dataSeriesObject.tooltipGroup.style('visibility', 'hidden');
                        }

                    }

                    return setTooltipVisibility('hidden');
                })
                .append('rect')
                .attr('fill', 'white');

            var _xScale = d3.scaleLinear();
            var _yScale = d3.scaleLinear();

            var _rendered = false;
            var _zippedData = [];

            var _margin = { top: 50, right: 20, bottom: 30, left: 50 };

            this.margin = {
                top: function(top) {
                    _margin.top = top;
                    updateTransforms();
                    return this;
                },
                right: function(right) {
                    _margin.right = right;
                    updateTransforms();
                    return this;
                },
                bottom: function(bottom) {
                    _margin.bottom = bottom;
                    updateTransforms();
                    return this;
                },
                left: function(left) {
                    _margin.left = left;
                    updateTransforms();
                    return this;
                },
                setAll: function(top, right, bottom, left) {
                    _margin.top = top;
                    _margin.right = right;
                    _margin.left = left;
                    _margin.bottom = bottom;
                    updateTransforms();
                    return this;
                }
            };

            var updateTransforms = function() {

                // Get the origin position on screen for the axes to be translated there
                var x0, y0;
                x0 = _xScale(0);
                y0 = _yScale(0);

                var xRange = _xScale.range().sort(d3.ascending);
                var yRange = _yScale.range().sort(d3.ascending);

                if (x0 < xRange[0] || x0 > xRange[1])
                    x0 = 0;

                if (y0 < yRange[0] || y0 > yRange[1])
                    y0 = yRange[1];

                _svg
                    .attr('width', _width + _margin.left + _margin.right)
                    .attr('height', _height + _margin.top + _margin.bottom);

                _titleGroup
                    .attr('transform', 'translate(' + (_margin.left + 0.5 * _width) + ',' + 0.8 * _margin.top + ')');
                _lineGroup
                    .attr('transform', 'translate(' + _margin.left + ',' + _margin.top + ')');

                _lineGroup.select('rect')
                    .attr('width', _width)
                    .attr('height', _height);

                _xGroup
                    .attr('transform', 'translate(' + _margin.left + ',' + (y0 + _margin.top) + ')');
                _yGroup
                    .attr('transform', 'translate(' + (x0 + _margin.left) + ', ' + _margin.top + ')');


            };

            var interpolateMouse = function(coords) {

                //Calculate the value for each series by interpolating between the current interval

                var mouse_x = coords.x;

                var valuesOfSeries = [];

                //Get the value of x in the data space
                var x = _xScale.invert(mouse_x);

                for (var key in _series) {
                    if (_series.hasOwnProperty(key)) {
                        //Looping through every series name using hasOwnProperty

                        //Do a binary search operation to find the appropriate interval for this x value in the data space
                        //Then interpolate using the given x value (y = mx + b)

                        var seriesObj = _series[key];
                        var x_array = seriesObj.x();
                        var y_array = seriesObj.y();

                        //It's out the bounds of this series just skip it
                        if (x < x_array[0] || x > x_array[x_array.length - 1])
                            continue;

                        //Binary search (similar type of thing)
                        //Used to find the appropriate interval for interpolation
                        var index = x_array.length / 2;
                        var splice = 0;
                        var iters = 0;
                        while(true) {

                            ++iters;

                            if (x >= x_array[index]) {
                                if (x < x_array[index + 1])
                                    //We've found the appropriate interval
                                    break;

                                splice = index;
                                index = index + (x_array.length - index) / 2;

                            } else {
                                if (x > x_array[index - 1]) {
                                    //The left interval is appropriate, decrement then break
                                    --index;
                                    break;
                                }

                                index = index - (index - splice) / 2; //Go to the left half of the array

                            }

                            if (Math.floor(index) == 0)
                                break;

                            index = Math.round(index);

                            if (index == x_array.length) {
                                --index;
                                break;
                            }

                        }

                        // Use the index for the appropriate interval to interpolate the y value
                        var slope = (y_array[index + 1] - y_array[index]) / (x_array[index + 1] - x_array[index]);

                        var d_x = x - x_array[index];
                        var value = y_array[index] + slope * d_x;

                        valuesOfSeries.push({
                            series: key,
                            value: value
                        });

                    }
                }

                return valuesOfSeries;

            };

            var _includeOrigin = false;

            this.includeOrigin = function(val) {
                if (val === undefined)
                    return _includeOrigin;
                _includeOrigin = val;
                return this;
            };

            this.width = function(width) {
                _svg.attr('width', width);
                _width = width;
                _lineGroup
                    .attr('transform', 'translate(' + _width * 0.05 + ',' + _height * 0.05 + ')');
                updateTransforms();
                return this;
            };

            this.height = function(height) {
                _svg.attr('height', height);
                _height = height;
                _lineGroup
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
                _xGroup
                    .call(d3.axisBottom(_xScale));
                _yGroup
                    .call(d3.axisLeft(_yScale));
            };

            this.update = function() {
                //Initialize to an empty domain
                var xExtent = [0, 0];
                var yExtent = [0, 0];

                var data = [];
                for (var key in _series) {
                    var series = _series[key];
                    var xSeriesExt = d3.extent(series.x());
                    var ySeriesExt = d3.extent(series.y());

                    xExtent = unionBounds(xExtent, xSeriesExt);
                    yExtent = unionBounds(yExtent, ySeriesExt);

                    data.push(series.zip());

                }

                //Adjust the bounds to include 0 in the scale domains
                if (_includeOrigin) {
                    xExtent = adjustDomain(xExtent);
                    yExtent = adjustDomain(yExtent);
                }

                _xScale
                    .domain(xExtent)
                    .range([0, _width]);

                _yScale
                    .domain(yExtent)
                    .range([_height, 0]);

                updateTransforms();

                _svg.selectAll('path')
                    .data(data)
                    .attr('d', line);

                _titleText
                    .text(title);

                updateAxes();

                if (_tooltip_visible)
                    updateToolTip(_prevMouse);

            };

            updateTransforms();

            return this;

        }

        return new LineGraphObject(id, title);

    }

};