/**
 * Визуализация раскроя
 * @module visualization
 * Created 18.06.2016
 */

(function () {

	function Visualization(element, engine) {

		this.canvas = document.createElement('canvas');
		element.appendChild(this.canvas);
		this.scope = new paper.constructor();
		this.scheme = new paper.Project(this.canvas);

		this.engine = new Visualization[engine];

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