/**
 * Created by gabriel on 17/07/16.
 */

function adjustDomain(bounds) {
    if (bounds[0] > 0)
        bounds[0] = 0;
    else if (bounds[1] < 0)
        bounds[1] = 0;
    return bounds;
}

function unionBounds(bound1, bound2) {

    //Takes the union of domains for different series of a line graph (in order to be used to find a common scale)

    bound1 = bound1.sort(d3.ascending);
    bound2 = bound2.sort(d3.ascending);



}

d3graphs = {



    line: function(id, title) {

        var lineGraphObject = function(id, title) {

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

            _lineGroup.append('path');

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
                    y0 = 0;

                _svg
                    .attr('width', _width + _margin.left + _margin.right)
                    .attr('height', _height + _margin.top + _margin.bottom);

                _titleGroup
                    .attr('transform', 'translate(' + (_margin.left + 0.5 * _width) + ',' + 0.8 * _margin.top + ')');
                _lineGroup
                    .attr('transform', 'translate(' + _margin.left + ',' + _margin.top + ')');
                _xGroup
                    .attr('transform', 'translate(' + _margin.left + ',' + (-y0 + _height + _margin.top) + ')');
                _yGroup
                    .attr('transform', 'translate(' + (x0 + _margin.left) + ', ' + _margin.top + ')');


            };

            var _includeOrigin = false;

            this.includeOrigin = function(val) {
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

            var _series = {};

            function DataSeries(seriesName) {

                _lineGroup.append('path');

                var _x_series = [], _y_series = [];
                this.x = function(xSeries) {
                    if (xSeries === undefined)
                        return _x_series;

                    _x_series = xSeries;
                    return this;
                };
                this.y = function(ySeries) {
                    if (ySeries === undefined)
                        return _y_series;

                    _y_series = ySeries;
                    return this;
                };
                this.append = {
                    x: function(x) {
                        _x_series.concat(x);
                        return this;
                    },
                    y: function(y) {
                        _y_series.concat(y);
                        return this;
                    }
                }
            }

            //Gets or returns the data object for the series name
            this.data = function(seriesName) {

                //Can be used as a getter for all the data series currently on the graph
                if (seriesName === undefined) {
                    return _series;
                }

                if (seriesName in _series) {
                    //The series already exists just use it as a getter
                    return _series[seriesName];
                }

                var series = new DataSeries(seriesName);
                _series[seriesName] = series;
                return series;

            };

            this.data = {
                //Interface for replacing/appending data to the series of the graph
                x: function(x_series) {
                    _x_series = x_series;
                    updateZip();
                    return this;
                },
                y: function(y_series) {
                    _y_series = y_series;
                    updateZip();
                    return this;
                },
                append: {
                    x: function(x) {
                        _x_series = _x_series.concat(x);
                        updateZip();
                        return this;
                    },
                    y: function(y) {
                        _y_series = _y_series.concat(y);
                        updateZip();
                        return this;
                    }
                }
            };

            var line = d3.line()
                .x(function (d) { return _xScale(d.x); })
                .y(function (d) { return _yScale(d.y); });

            var updateAxes = function() {
                _xGroup
                    .call(d3.axisBottom(_xScale));
                _yGroup
                    .call(d3.axisLeft(_yScale));
            };

            //Adds 0 to a range [2, 4] becomes [0, 4] [-1, -0.3] becomes [-1, 0]


            this.update = function() {
                //Initialize to an empty domain
                var xExtent = [0, 0];
                var yExtent = [0, 0];

                for (var key in _series) {
                    var xSeriesExt = d3.extent(_series.x());
                    var ySeriesExt = d3.extent(_series.y());



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
                    .data([
                        _zippedData
                    ])
                    .attr('d', line)
                    .attr('class', 'line')
                    .attr('fill', 'none')
                    .attr('stroke', '#000')
                    .attr('stroke-width', '10');

                _titleText
                    .text(title);

                updateAxes();

            };

            updateTransforms();

            return this;

        };

        return new lineGraphObject(id, title);

    }

};