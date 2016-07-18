/**
 * Created by gabriel on 17/07/16.
 */

d3graphs = {
    line: function(id, title) {

        var _width = 0, _height = 0;
        var _x_series = [], _y_series = [];
        var svg = d3.select('body').append('svg')
            .attr('class', id);

        var _xScale = d3.scaleLinear();
        var _yScale = d3.scaleLinear();

        var _zippedData = [];

        this.width = function(width) {
            svg.attr('width', width);
            _width = width;
            return this;
        };

        this.height = function(height) {
            svg.attr('height', height);
            _height = height;
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

        this.update = function() {

            _xScale
                .domain(d3.extent(_x_series))
                .range([_width * 0.05, _width * 0.95]);

            _yScale
                .domain(d3.extent(_y_series))
                .range([_height * 0.95, _height * 0.05]);

            svg.selectAll('path')
                .data([
                    _zippedData
                    ])
                .enter()
                .append('path')
                .attr('d', line)
                .attr('class', id + '-line')
                .attr('fill', 'none')
                .attr('stroke', '#000')
                .attr('stroke-width', '10');

        };

        return this;

    }
};