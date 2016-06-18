/**
 * Визуализация раскроя
 * @module visualization
 * Created 18.06.2016
 */

(function () {

	function Visualization(engine, element) {

		this.canvas = document.createElement('canvas');
		this.canvas.style.width = "100%";
		this.canvas.style.height = "100%";
		this.canvas.style.backgroundColor = "whitesmoke";
		element.appendChild(this.canvas);
		this.scope = new paper.constructor();
		this.scheme = new paper.Project(this.canvas);

		this.engine = new Visualization[engine];

		this.resize_canvas = function(){

			this.scheme.view.viewSize.width = element.offsetWidth;
			this.scheme.view.viewSize.height = element.offsetHeight;

			this.scheme.zoom_fit();
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

			var x=0, y, w, h=88,
				path;

			for(var i=0; i<decision.workpieces.length; i++){

				if(i<userData.workpieces.length)
					w = userData.workpieces[i];
				else
					w = userData.sticklength;

				y = Math.round(h * 1.3) * i;

				path = new paper.Path({
					segments: [[x, y], [x+w, y], [x+w, y+h], [x, y+h]],
					strokeColor: 'grey',
					strokeScaling: false,
					strokeWidth: 1,
					closed: true
				});

			}

			this.scheme.zoom_fit();
			this.scheme.view.update();
		};
		
	}

	/**
	 * Визуализация линейного раскроя
	 * @constructor
	 */
	Visualization["1D"] = function V1D() {

	};

	/**
	 * Визуализация двумерного раскроя
	 * @constructor
	 */
	Visualization["2D"] = function V1D() {

	};

	/**
	 * Визуализация укладки  в пирамиды
	 * @constructor
	 */
	Visualization["Pyramid"] = function VPyramid() {

	};

	Genetic.Visualization = Visualization;

})();