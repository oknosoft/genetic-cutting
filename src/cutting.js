/**
 * Оптимизатор раскроя
 * @module cutting
 * Created 15.06.2016
 */

(function () {

	function Cutting(engine) {

		this.engine = new Cutting[engine];

		this.genetic = Genetic.create();
		this.genetic.optimize = Genetic.Optimize.Minimize;
		this.genetic.select1 = Genetic.Select1.Tournament2;
		this.genetic.select2 = Genetic.Select2.Tournament2;

		this.genetic.seed = this.engine.seed;
		this.genetic.mutate = this.engine.mutate;
		this.genetic.crossover = this.engine.crossover;
		this.genetic.fitness = this.engine.fitness;
		this.genetic.generation = this.engine.generation;

	}

	/**
	 * Движок линейного раскроя
	 * @constructor
	 */
	Cutting["1D"] = function C1D() {

		/*
		 this.userData: {
			 workpieces, // заготовки - массив длин
			 products,   // изделия - массив длин
			 decision;   // решение - массив номеров заготовок в порядке изделий
		 }
		 */


		/**
		 * Случайный массив индексов
		 * @return {Int16Array}
		 */
		this.seed = function() {

			var len = this.userData.products.length,
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

			// single-point crossover
			var len = mother.length,
				ca = Math.floor(Math.random()*len),
				son = new Int16Array(len).fill(-1),
				daughter = new Int16Array(len).fill(-1),
				tmp = new Int16Array(len),
				tmp_len, i;


			// начальные кусочки от родителей заполняем без хитростей, но запоминаем индексы второго родителя
			tmp.fill(-1);
			tmp_len = 0;
			for(i=0; i<ca; i++){
				son[i] = father[i];

				tmp[tmp_len] = mother.indexOf(son[i]);
				tmp_len++;
			}

			tmp_len = ca;
			for(i=0; i<len; i++){
				if(tmp.indexOf(i) == -1){
					son[tmp_len] = mother[i];
					tmp_len++;
				}
			}


			tmp.fill(-1);
			tmp_len = 0;
			for(i=0; i<ca; i++){
				daughter[i] = mother[i];

				tmp[tmp_len] = father.indexOf(daughter[i]);
				tmp_len++;
			}

			tmp_len = ca;
			for(i=0; i<len; i++){
				if(tmp.indexOf(i) == -1){
					daughter[tmp_len] = father[i];
					tmp_len++;
				}
			}

			return [son, daughter];
		};

		/**
		 * Осуществляет укладку заготовок и оценку решения
		 * @param entity {Int16Array}
		 * @return {number}
		 */
		this.fitness = function(entity, decision) {

			var fitness = 0,
				len = entity.length,
				res = new Int16Array(len),
				userData = this.userData,
				workpieces = Array.from(userData.workpieces),
				scraps = workpieces.length,
				workpiece_index, scrap_len, min_len, i;

			for (i=0; i<entity.length; ++i) {

				min_len = Infinity;
				workpiece_index = -1;

				// бежим по заготовкам, ищем самую короткую, на которую можно уложить
				workpieces.some(function (val, index) {

					// получаем длину остатка
					scrap_len = val - userData.products[entity[i]] - userData.knifewidth;

					// укорачиваем заготовку на припуск
					if(index < scraps && userData.workpieces[index] == val && userData.overmeasure)
						scrap_len -= userData.overmeasure;

					// анализируем остаток
					if(scrap_len >= 0 && scrap_len < min_len){

						if(scrap_len > userData.wrongsnipmin && userData.wrongsnipmax && scrap_len < userData.wrongsnipmax){
							return;
						}
						
						min_len = scrap_len;
						workpiece_index = index;

						if(min_len == 0)
							return true;
					}
				});

				// если найдено - укладываем, иначе - добавляем палку
				if(workpiece_index >=0){
					workpieces[workpiece_index] = min_len;
					res[i] = workpiece_index;

				}else{
					workpieces.push(userData.sticklength - userData.products[entity[i]] - userData.overmeasure);
					res[i] = workpieces.length - 1;

				}
			}


			// в зависимости от признака decision, возвращаем оценку решения или полное решение
			if(!decision){
				workpieces.forEach(function (val, index) {
					fitness += 10e12;
					// форсируем использование обрези, уменьшая её цену
					if(index < scraps)
						fitness -= 10000;
					fitness -= val * val;
				});

			}else{
				fitness = {
					workpieces: workpieces,
					res: res,
					workpieces_len: 0,
					products_len: userData.products.reduce(function(a, b) { return a + b; }, 0),
					scraps_len: 0
				};

				workpieces.forEach(function (val, index) {

					if(index < scraps)
						fitness.workpieces_len += userData.workpieces[index];
					else
						fitness.workpieces_len += userData.sticklength;

					if(val >= userData.usefulscrap)
						fitness.scraps_len += val;
				});

				fitness.scraps_percent = (
					fitness.workpieces_len
					- fitness.products_len
					- fitness.scraps_len
					- userData.products.length * userData.knifewidth) * 100 / fitness.workpieces_len;
			}

			return fitness;
		};

		/**
		 * Принимает решение о целесообразности дальнейшей эволюции
		 * @param pop
		 * @param generation
		 * @param stats
		 * @return {boolean}
		 */
		this.generation = function(pop, generation, stats) {
			// stop running once we've reached the solution
			return true;
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
	Cutting["Pyramid"] = function CPyramid() {

	};

	Genetic.Cutting = Cutting;
	
})();


