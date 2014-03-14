import EO from './ember_orbit/main';
import Model from './ember_orbit/model';
import attr from './ember_orbit/attr';
import hasOne from './ember_orbit/has_one';
import hasMany from './ember_orbit/has_many';

EO.Model = Model;
EO.attr = attr;
EO.hasOne = hasOne;
EO.hasMany = hasMany;

export default EO;
