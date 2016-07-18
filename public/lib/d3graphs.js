/**
 * Created by gabriel on 17/07/16.
 */

d3graphs = {
    line: function(id, title) {

        var _width = 0, _height = 0;
        var _x_series = [], _y_series = [];
        var svg = d3.select('body').append('svg')
            .attr('class', id);

        this.width = function(width) {
            svg.attr('width', width);
            width = _width;
            return this;
        };

        this.height = function(height) {
            svg.attr('height', height);
            _height = height;
            return this;
        };

        this.data = {
            //Interface for replacing/appending data to the series of the graph
            x: function(x_series) {
                _x_series = x_series;
                return this;
            },
            y: function(y_series) {
                _y_series = y_series;
                return this;
            },
            append: {
                x: function(x) {
                    _x_series = _x_series.concat(x);
                },
                y: function(y) {
                    _y_series = _y_series.concat(y);
                }
            }
        };

        this.update = function() {
        };

        return this;

    }
};