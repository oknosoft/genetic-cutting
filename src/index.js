/**
 *
 *
 * @module index
 *
 * Created by Evgeniy Malyarov on 27.09.2018.
 */

const Genetic = require('./genetic');
const Engine1D  = require('./Engine1D');

class Cutting {
  constructor(userData) {

    this.engine = new Engine1D();

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

  evolve(config, userData) {
    return this.engine.evolve(this.genetic, config, userData);
  }
}

module.exports = Cutting;