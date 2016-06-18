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
	Visualization["1D"] = function V1D(visualization) {

		this.draw = function (userData, decision) {

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

				var res = [];
				decision.res.forEach(function (val, index) {
					if(val == i){
						res.push(userData.products[index]);
					}
				});
				res.sort(function (a,b) {
					return b-a
				});
				res.reduce(function (sum, curr) {
					new paper.Path({
						segments: [[x+sum+h/2, y+4], [x+sum+curr-h/2, y+4], [x+sum+curr, y+h-4], [x+sum, y+h-4]],
						fillColor: new paper.Color(Math.random() * 0.2 + 0.7, Math.random() * 0.3 + 0.6, Math.random() * 0.2 + 0.7),
						closed: true
					});
					new paper.PointText({
						point: [x+sum+curr/2, y+24+h/2],
						content: curr,
						fillColor: 'black',
						justification: 'center',
						fontSize: 72
					});
					return sum + curr + userData.knifewidth;
				}, 0);

			}
		};

	};

	/**
	 * Визуализация двумерного раскроя
	 * @constructor
	 */
	Visualization["2D"] = function V1D() {

		this.draw = function (userData, decision) {

		}
	};

	/**
	 * Визуализация укладки  в пирамиды
	 * @constructor
	 */
	Visualization["Pyramid"] = function VPyramid() {

		this.draw = function (userData, decision) {

		}

	};

	Genetic.Visualization = Visualization;

})();