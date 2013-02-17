// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)

// "use strict";

var isNode = (typeof require == "function" && typeof load == "undefined");
if (isNode)  {
  // We're in Node.
  var fs = require("fs");
  var path = require("path");

  var load = function(file) {
    var source = fs.readFileSync(file, "utf8");
    ("global", eval)(source);
  };
}

load("../third_party/doh/runner.js");

load("console.js");

load("../src/c.js");
load("../src/HashTable.js");
load("../src/HashSet.js");
load("../src/Error.js");
load("../src/SymbolicWeight.js");
load("../src/Strength.js");
load("../src/Variable.js");
load("../src/Point.js");
load("../src/Expression.js");
load("../src/Constraint.js");
load("../src/Constraint.js");
load("../src/EditInfo.js");
load("../src/Tableau.js");
load("../src/SimplexSolver.js");
load("../src/Timer.js");

/*
c.debug = false;
c.trace = false;
c.traceAdded = false;
c.verbose = false;
*/
doh.squelch = false;

// load("c-test.js");
// load("Constraint-test.js");
// load("Expression-test.js");
// load("Point-test.js");
// load("SimplexSolver-test.js");
// load("Strength-test.js");
// load("SymbolicWeight-test.js");
// load("Tableau-test.js");
// load("Variable-test.js");
// load("End-To-End-test.js");

if(isNode) {
  doh.run();
}
