// Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)
//
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0

(function() {

"use strict";

var c = require("../");
var t = require("chai").assert;
t.is = t.deepEqual;
t.t = t;

describe("c", function() {
  describe("_inc", function() {
    it("should increment monotnically", function() {
      var v = c._inc();
      t.is(v+1, c._inc());
    });
  });

  describe("own", function() {
    var p = { thinger: true };
    var C = function() {
      this.ownProp = true;
    };
    C.prototype = Object.create(p);
    var o = new C();
    var count = 0;
    c.own(o, function() { count++; })
    it("should only have the local property we just set", function() {
      t.is(1, count);
    });
  });

  describe("extend", function() {
    var o = {};
    var ctr = 0;
    var props = {
      get foo() {
        return "foo";
      },
      set foo(v) {
        ctr++;
      },
      key: "value",
      method: function() {
        return "function";
      }
    };

    it("is sane", function() {
      t.is({}, o);
    });


    // Ugg...I hate communicating over (possibly async) code bodies like this
    it ("is setup", function() {
      c.extend(o, props);
    });

    it("should correctly assign/use getters & setters", function() {
      t.is(0, ctr);
      o.foo = 10;
      t.is(1, ctr);
      props.foo = 10;
      t.is(2, ctr);
    });

    it("sets property descriptors correctly", function() {
      var keyPd = Object.getOwnPropertyDescriptor(o, "key");
      t.is(true, keyPd.writable);
      t.is(true, keyPd.configurable);
      t.is(true, keyPd.enumerable);
      t.is("string", typeof keyPd.value);
      t.is("value", keyPd.value);
    });

    it("sets method descriptors correctly", function() {
      var methodPd = Object.getOwnPropertyDescriptor(o, "method");
      t.is(true, methodPd.writable);
      t.is(true, methodPd.configurable);
      t.is(false, methodPd.enumerable);
      // print(Object.keys(methodPd));
      t.is("function", typeof methodPd.value);
    });

    it("sets getter/setter descriptors correctly", function() {
      var getSetPd = Object.getOwnPropertyDescriptor(o, "foo");
      t.is("function", typeof getSetPd.set);
      t.is("function", typeof getSetPd.get);
      t.is(true, getSetPd.enumerable);
      t.is(true, getSetPd.configurable);
    });
  });

  describe("inherit", function() {
    var Classic = function() {
      this.i = c._inc();
    }
    Classic.prototype = {
      superProtoProp: true,
    };
    var props = {
      _t: "Whatevs",
      initialize: function() {
        Classic.call(this);
      },
      extends: Classic,

      inc: function() {
        return ++this.i;
      },

      set value(value) {
        this._value = value;
      },

      get value() {
        return this._value;
      },
    };

    var C = c.inherit(props);

    it("is sane", function() {
      t.is("function", typeof C);
    });
    it("clobbered initialize", function() {
      t.is(undefined, props.initialize);
    });
    it("clobbered extends", function() {
      t.is(undefined, props.extends);
    });

    var i = new C();
    var j = new C();
    var v = i.i;
    it("is constructor chaining", function() {
      t.is(v+1, j.i);
    });
    it("is mapping protototypes in", function() {
      t.t(i.superProtoProp);
      Classic.prototype.superProtoProp = 10;
      t.is(10, i.superProtoProp);
    });

    it("sets up class-level methods with a sane 'this'", function() {
      t.is(v+1, i.inc());
      t.is(v+2, i.inc());
    });

    it("assigns setters correctly", function() {
      i.value = "thinger";
      t.is("thinger", i.value);
      t.is("thinger", i._value);
    });
  });

  describe("basicJSON", function() {
    var symbolicZeroValue = new c.SymbolicWeight(0, 0, 0).value;
    it("serializes c.SymbolicWeight instances correctly", function() {
      t.is({ _t: "c.SymbolicWeight", value: symbolicZeroValue },
           (new c.SymbolicWeight(0, 0, 0)).toJSON());
    });

    var solver = new c.SimplexSolver();

    var x = new c.Variable({ name: "x", value: 10 });
    var width = new c.Variable({ name: "width", value: 10 });
    var right = new c.Expression(x).plus(width);
    var ieq = new c.Inequality(100, c.LEQ, right);

    solver.addStay(width)
          .addConstraint(ieq);

    var ir = solver._infeasibleRows;
    it("has sane JSON.stringify() behavior for a c.HashSet", function() {
      t.is('{"_t":"c.HashSet","data":[]}', JSON.stringify(ir));
    });

    it("handles 2-deep object/type graphs", function() {
      t.is(
        { _t: "c.HashSet",
          data: [
                    { _t: "c.Variable", name: "width", value: 10 },
                    { _t: "c.Variable", name: "x", value: 90 }
          ]
        },
        solver._externalRows.toJSON()
      );
    });

    // Smoke test
    it("doesn't blow up on rehydration", function() {
      var rehydratedER = c.parseJSON(JSON.stringify(solver._externalRows));
    });

    // FIXME(slightlyoff):
    //    need to filter out the "hashCode" property for deep equality test
    // t.is(rehydratedER, solver._externalRows);
  });

  describe("approx", function() {
    it("is sane across integers", function() {
      t.t(c.approx(25, 25));
      t.f(c.approx(25, 26));
    });
    it("handles c.Variables", function() {
      t.t(c.approx(new c.Variable({ value: 25 }), new c.Variable({ value: 25 })));
      t.f(c.approx(new c.Variable({ value: 25 }), new c.Variable({ value: 26 })));
    });
    it("is correct for small differences", function() {
      t.t(c.approx(0, 0.000000001));
      t.f(c.approx(0, 0.00000001));
      t.t(c.approx(0.000000001, 0));
      t.f(c.approx(0.00000001, 0));
      t.t(c.approx(25, 25.000000001));
      t.f(c.approx(25, 25.000001));
    });
  });

  // TODO(slightlyoff)
  describe("assert", function() {

  });

  describe("plus", function() {

  });

  describe("minus", function() {

  });

  describe("times", function() {

  });

  describe("divide", function() {

  });
});

  /*
  function fromJSON(t) {
    var solver = new c.SimplexSolver();

    var x = new c.Variable({ value: 10 });
    var width = new c.Variable({ value: 10 });
    var right = new c.Expression(x).plus(width);
    var ieq = new c.Inequality(100, c.LEQ, right);

    solver.addStay(width)
          .addConstraint(ieq);

    t.is(x.value, 90);
    t.is(width.value, 10);
  },
  */
/*
*/
  /*
  */
/*
]);
*/

})();
