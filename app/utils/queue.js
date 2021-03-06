/* eslint func-names: ["error", "never"] */

// import log from 'electron-log';

// the queue adds all new ones in front
// const q = new Queue():
// q.add(1);
// q.add(2);
// q.add(3);
// console.log(q);
// // [3,2,1]

function Queue() {
  this.data = [];
}

Queue.prototype.add = function(record) {
  this.data.unshift(record);
}

Queue.prototype.addArray = function(arrayOfRecords) {
  const combinedArray  = [...this.data, ...arrayOfRecords];
  this.data = combinedArray;
}

Queue.prototype.removeFirst = function() {
  return this.data.shift();
}

Queue.prototype.removeFirstMany = function(amount) {
  return this.data.splice(0, amount);
}

Queue.prototype.removeLastMany = function(amount) {
  return this.data.splice(amount * -1, amount);
}

Queue.prototype.removeLast = function() {
  return this.data.pop();
}

Queue.prototype.clear = function() {
  this.data = [];
}

Queue.prototype.first = function() {
  return this.data[0];
}

Queue.prototype.last = function() {
  return this.data[this.data.length - 1];
}

Queue.prototype.size = function() {
  return this.data.length;
}

export default Queue;
