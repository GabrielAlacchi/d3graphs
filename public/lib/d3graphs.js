/**
 * Created by gabriel on 17/07/16.
 */

d3graphs = {
    line: function(id, title) {

        var _width = 0, _height = 0;
        var _x_series = [], _y_series = [];
        var _svg = d3.select('body').append('svg')
            .attr('class', id);

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

        var _margin = { top: 20, right: 20, bottom: 30, left: 50 };

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

            _svg
                .attr('width', _width + _margin.left + _margin.right)
                .attr('height', _height + _margin.top + _margin.bottom);

            _lineGroup
                .attr('transform', 'translate(' + _margin.left + ',' + _margin.top + ')');
            _xGroup
                .attr('transform', 'translate(' +_margin.left + ',' + (y0 + _height + _margin.top) + ')');
            _yGroup
                .attr('transform', 'translate(' + x0 + _margin.left + ', ' + _margin.top + ')');
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
        var adjustBounds = function(bounds) {
            if (bounds[0] > 0)
                bounds[0] = 0;
            else if (bounds[1] < 0)
                bounds[1] = 0;
            return bounds;
        };

        this.update = function() {

            var xExtent = d3.extent(_x_series);
            var yExtent = d3.extent(_y_series);

            //Adjust the bounds to include 0 in the scale domains
            if (_includeOrigin) {
                xExtent = adjustBounds(xExtent);
                yExtent = adjustBounds(yExtent);
            }

            _xScale
                .domain(xExtent)
                .range([0, _width]);

            _yScale
                .domain(yExtent)
                .range([_height, 0]);

            _svg.selectAll('path')
                .data([
                    _zippedData
                ])
                .attr('d', line)
                .attr('class', id + '-line')
                .attr('fill', 'none')
                .attr('stroke', '#000')
                .attr('stroke-width', '10');

            updateAxes();

        };

        updateTransforms();

        return this;

    }
};