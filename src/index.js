

module.exports = function cut($p, log, route) {
  
  if($p.job_prm.server.cut_url) {
    log('cutting service started');
    route.cut = require('./server')($p, log);
    route.work_centers_task = require('./work_centers_task')($p, log);
  }
  else {
    log('cutting service skipping');
  }

}
