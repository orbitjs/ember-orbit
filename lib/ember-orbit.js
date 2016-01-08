import EO from 'ember-orbit/main';
import Store from 'ember-orbit/store';
import Model from 'ember-orbit/model';
import Schema from 'ember-orbit/schema';
import key from 'ember-orbit/fields/key';
import attr from 'ember-orbit/fields/attr';
import hasMany from 'ember-orbit/fields/has-many';
import hasOne from 'ember-orbit/fields/has-one';
import HasManyArray from 'ember-orbit/relationships/has-many';
import Transaction from 'ember-orbit/transaction';

EO.Store = Store;
EO.Model = Model;
EO.Schema = Schema;
EO.key = key;
EO.attr = attr;
EO.hasOne = hasOne;
EO.hasMany = hasMany;
EO.HasManyArray = HasManyArray;
EO.Transaction = Transaction;

export default EO;
