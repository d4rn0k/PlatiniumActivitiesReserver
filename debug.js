const isDebugMode = true;

console.debug = function(args) {
  if (isDebugMode) {
    console.log(args);
  }
}
