/**
 * Оптимизатор раскроя
 * @module cutting
 * Created 15.06.2016
 */

(function () {

	var Genetic = Genetic || require('./genetic');


	function Cutting(engine) {

		this.engine = new Cutting[engine];

		Object.defineProperties(this, {

			workpieces: {
				get: this.engine.workpieces,
				set: this.engine.workpieces
			},

			products: {
				get: this.engine.products,
				set: this.engine.products
			}

		});

	}

	/**
	 * Движок линейного раскроя
	 * @constructor
	 */
	Cutting["1D"] = function C1D() {

		var workpieces, // заготовки - массив длин
			products,   // изделия - массив длин
			decision;   // решение - массив номеров заготовок в порядке изделий

		/**
		 * Заготовки - хлысты
		 * @param v {String|Array}
		 * @return {Int32Array}
		 */
		this.workpieces = function (v) {

			if(typeof v == "string")
				workpieces = new Int32Array(v.split(","));

			else if(Array.isArray(v))
				workpieces = new Int32Array(v);


			return workpieces;
		};

		/**
		 * Изделия - отрезки
		 * @param v {String|Array}
		 * @return {Int32Array}
		 */
		this.products = function (v) {

			if(typeof v == "string")
				products = new Int32Array(v.split(","));

			else if(Array.isArray(v))
				products = new Int32Array(v);

			return products;
		};


		/**
		 * Случайный массив индексов
		 * @return {Int16Array}
		 */
		this.seed = function() {

			var len = workpieces.length,
				decision = new Int16Array(len).fill(-1),
				ind, i2;

			for(var i=0; i<len; i++){

				ind = Math.floor(Math.random() * (len - i));

				i2 = 0;
				while((i2<ind) || (decision[ind]>=0)){
					if(decision[i2]>=0)
						ind++;
					i2++;
				}
				decision[ind] = i;
			}

			// create random strings that are equal in length to solution
			return decision;
		};

		/**
		 * Мутация - перестановка двух случайных генов
		 * @param entity {Int16Array}
		 * @return {Int16Array}
		 */
		this.mutate = function(entity) {

			// chromosomal drift
			var len = entity.length,
				i = Math.floor(Math.random()*len),
				j = Math.floor(Math.random()*len);

			while (i == j && len > 1)
				j = Math.floor(Math.random()*entity.length);

			var k = entity[j];
			entity[j] = entity[i];
			entity[i] = k;

			return entity;
		};


		/**
		 * Смешивает гены родителей
		 * @param mother
		 * @param father
		 * @return {Int16Array[]}
		 */
		this.crossover = function(mother, father) {

			// two-point crossover
			var len = mother.length,
				ca = Math.floor(Math.random()*len),
				cb = Math.floor(Math.random()*len),
				son = new Int16Array(len).fill(-1),
				daughter = new Int16Array(len).fill(-1),
				i, val, index;

			if (ca > cb) {
				var tmp = cb;
				cb = ca;
				ca = tmp;
			}

			// начальные кусочки от родителей завполняем без хитростей
			for(i=0; i<ca; i++){
				son[i] = father[i];
				daughter[i] = mother[i];
			}

			for(i=ca0; i<cb; i++){

				// текущее значение от другого родителя
				val = mother[i];
				index = father.indexOf(val);

				// если место кусочка у родителей совпадает, возвращаем текущее значение от другого родителя
				if(index >= ca && index < cb){
					son[i] = father[i];
				}else{
					son[i] = father[i];
				}

				// текущее значение от другого родителя
				val = father[i];
				index = mother.indexOf(val);

				// если место кусочка у родителей совпадает, возвращаем текущее значение от другого родителя
				if(index >= ca && index < cb){
					daughter[i] = mother[i];
				}else{
					daughter[i] = mother[i];
				}
			}


			var son = father.map(function (val, index) {


				if(index < ca)
					return val;


				var mval = mother[index],
					find = father.indexOf(mval);

				// если место кусочка у родителей совпадает, возвращаем текущее значение от другого родителя
				if(find >= ca && find < cb)
					return mval;



			});

			var daughter = mother.map(function (val, index) {
				if(index < ca)
					return val;
			});
			
			var son = father.subarray(0,ca) + mother.subarray(ca, cb-ca) + father.subarray(cb);
			var daughter = mother.subarray(0,ca) + father.subarray(ca, cb-ca) + mother.subarray(cb);

			return [son, daughter];
		};

	};

	/**
	 * Движок раскроя полубесконечной полосы
	 * @constructor
	 */
	Cutting["15D"] = function C15D() {

	};

	/**
	 * Движок двумерного раскроя
	 * @constructor
	 */
	Cutting["2D"] = function C2D() {

	};

	/**
	 * Движок укладки  в пирамиды
	 * @constructor
	 */
	Cutting["Pyramid"] = function Pyramid() {

	};

	Genetic.Cutting = Cutting;

})();


