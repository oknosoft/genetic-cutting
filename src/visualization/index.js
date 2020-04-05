/**
 * Визуализация раскроя
 * &copy; Evgeniy Malyarov http://www.oknosoft.ru 2014-2016
 * @module visualization
 * Created 18.06.2016
 */

(function () {

	function Visualization(engine, element) {

    this.canvas = document.createElement('canvas');
    Object.assign(this.canvas.style, {
      width: '100%',
      height: '100%',
      backgroundColor: 'whitesmoke'
    });
    element.appendChild(this.canvas);
    this.scope = new paper.constructor();
    this.scheme = new paper.Project(this.canvas);

		this.engine = new Visualization[engine](this);

		this.scheme.resize_canvas = function(){

			this.view.viewSize.width = element.offsetWidth;
			this.view.viewSize.height = element.offsetHeight;

			this.zoom_fit();
		};

		this.scheme.zoom_fit = function () {

			var bounds = this.activeLayer && this.activeLayer.strokeBounds;

			if(bounds && bounds.height && bounds.width){
				this.view.zoom = Math.min((this.view.viewSize.height - 8) / bounds.height, (this.view.viewSize.width - 8) / bounds.width);
				this.view.center = bounds.center;
			}
		};


		this.draw = function (userData, decision) {

			this.scheme.clear();

			this.engine.draw(userData, decision);

			this.scheme.zoom_fit();
			this.scheme.view.update();
		};
		
	}

	/**
	 * Визуализация линейного раскроя
	 * @constructor
	 */
	Visualization["1D"] = require('./Visualization1D');

	/**
	 * Визуализация двумерного раскроя
	 * @constructor
	 */
	Visualization["2D"] = require('./Visualization2D');

	/**
	 * Визуализация укладки  в пирамиды
	 * @constructor
	 */
	Visualization["Pyramid"] = require('./VisualizationPyramid');

	Genetic.Visualization = Visualization;

})();