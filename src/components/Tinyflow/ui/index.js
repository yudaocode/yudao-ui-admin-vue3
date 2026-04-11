var tf = Object.defineProperty;
var Pa = (e) => {
  throw TypeError(e);
};
var nf = (e, t, n) => t in e ? tf(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var wt = (e, t, n) => nf(e, typeof t != "symbol" ? t + "" : t, n), Ji = (e, t, n) => t.has(e) || Pa("Cannot " + n);
var it = (e, t, n) => (Ji(e, t, "read from private field"), n ? n.call(e) : t.get(e)), rr = (e, t, n) => t.has(e) ? Pa("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, n), Gr = (e, t, n, r) => (Ji(e, t, "write to private field"), r ? r.call(e, n) : t.set(e, n), n), Na = (e, t, n) => (Ji(e, t, "access private method"), n);
const rf = "5";
var Ll;
typeof window < "u" && ((Ll = window.__svelte ?? (window.__svelte = {})).v ?? (Ll.v = /* @__PURE__ */ new Set())).add(rf);
let Br = !1, of = !1;
function sf() {
  Br = !0;
}
sf();
const Os = 1, Is = 2, Ol = 4, af = 8, lf = 16, uf = 1, cf = 2, Il = 4, df = 8, ff = 16, zl = 1, gf = 2, zs = "[", Rs = "[!", Bs = "]", _r = {}, Pt = Symbol(), Rl = "http://www.w3.org/2000/svg", Ma = !1, nn = 2, Bl = 4, Si = 8, Ys = 16, On = 32, Yr = 64, ti = 128, qt = 256, ni = 512, mt = 1024, In = 2048, gr = 4096, Mn = 8192, Pi = 16384, hf = 32768, Zr = 65536, vf = 1 << 17, pf = 1 << 19, Yl = 1 << 20, Wn = Symbol("$state"), Zs = Symbol("legacy props"), mf = Symbol("");
var Co = Array.isArray, yf = Array.prototype.indexOf, Xs = Array.from, ri = Object.keys, so = Object.defineProperty, Tn = Object.getOwnPropertyDescriptor, Zl = Object.getOwnPropertyDescriptors, wf = Object.prototype, _f = Array.prototype, Fs = Object.getPrototypeOf;
function Ur(e) {
  return typeof e == "function";
}
const dt = () => {
};
function xf(e) {
  return e();
}
function ao(e) {
  for (var t = 0; t < e.length; t++)
    e[t]();
}
const bf = typeof requestIdleCallback > "u" ? (e) => setTimeout(e, 1) : requestIdleCallback;
let lo = [], uo = [];
function Xl() {
  var e = lo;
  lo = [], ao(e);
}
function Fl() {
  var e = uo;
  uo = [], ao(e);
}
function ko(e) {
  lo.length === 0 && queueMicrotask(Xl), lo.push(e);
}
function Cf(e) {
  uo.length === 0 && bf(Fl), uo.push(e);
}
function Ta() {
  lo.length > 0 && Xl(), uo.length > 0 && Fl();
}
function Wl(e) {
  return e === this.v;
}
function Ws(e, t) {
  return e != e ? t == t : e !== t || e !== null && typeof e == "object" || typeof e == "function";
}
function Ks(e) {
  return !Ws(e, this.v);
}
function kf(e) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function $f() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function Ef(e) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function Sf() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function Pf() {
  throw new Error("https://svelte.dev/e/hydration_failed");
}
function Nf(e) {
  throw new Error("https://svelte.dev/e/props_invalid_value");
}
function Mf() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function Tf() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function Hf() {
  throw new Error("https://svelte.dev/e/state_unsafe_local_read");
}
function Vf() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
function Mt(e, t) {
  var n = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: e,
    reactions: null,
    equals: Wl,
    rv: 0,
    wv: 0
  };
  return n;
}
function Un(e) {
  return /* @__PURE__ */ Kl(Mt(e));
}
// @__NO_SIDE_EFFECTS__
function $o(e, t = !1) {
  var r;
  const n = Mt(e);
  return t || (n.equals = Ks), Br && Ze !== null && Ze.l !== null && ((r = Ze.l).s ?? (r.s = [])).push(n), n;
}
function re(e, t = !1) {
  return /* @__PURE__ */ Kl(/* @__PURE__ */ $o(e, t));
}
// @__NO_SIDE_EFFECTS__
function Kl(e) {
  return je !== null && !en && je.f & nn && (vn === null ? Lf([e]) : vn.push(e)), e;
}
function U(e, t) {
  return je !== null && !en && Di() && je.f & (nn | Ys) && // If the source was created locally within the current derived, then
  // we allow the mutation.
  (vn === null || !vn.includes(e)) && Vf(), gs(e, t);
}
function gs(e, t) {
  return e.equals(t) || (e.v, e.v = t, e.wv = tu(), ql(e, In), Di() && qe !== null && qe.f & mt && !(qe.f & (On | Yr)) && (En === null ? Of([e]) : En.push(e))), t;
}
function Ha(e, t = 1) {
  var n = h(e), r = t === 1 ? n++ : n--;
  return U(e, n), r;
}
function ql(e, t) {
  var n = e.reactions;
  if (n !== null)
    for (var r = Di(), o = n.length, i = 0; i < o; i++) {
      var s = n[i], a = s.f;
      a & In || !r && s === qe || (rn(s, t), a & (mt | qt) && (a & nn ? ql(
        /** @type {Derived} */
        s,
        gr
      ) : Hi(
        /** @type {Effect} */
        s
      )));
    }
}
// @__NO_SIDE_EFFECTS__
function Me(e) {
  var t = nn | In, n = je !== null && je.f & nn ? (
    /** @type {Derived} */
    je
  ) : null;
  return qe === null || n !== null && n.f & qt ? t |= qt : qe.f |= Yl, {
    ctx: Ze,
    deps: null,
    effects: null,
    equals: Wl,
    f: t,
    fn: e,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      null
    ),
    wv: 0,
    parent: n ?? qe
  };
}
// @__NO_SIDE_EFFECTS__
function pe(e) {
  const t = /* @__PURE__ */ Me(e);
  return t.equals = Ks, t;
}
function Gl(e) {
  var t = e.effects;
  if (t !== null) {
    e.effects = null;
    for (var n = 0; n < t.length; n += 1)
      Gt(
        /** @type {Effect} */
        t[n]
      );
  }
}
function Df(e) {
  for (var t = e.parent; t !== null; ) {
    if (!(t.f & nn))
      return (
        /** @type {Effect} */
        t
      );
    t = t.parent;
  }
  return null;
}
function Af(e) {
  var t, n = qe;
  Jn(Df(e));
  try {
    Gl(e), t = ru(e);
  } finally {
    Jn(n);
  }
  return t;
}
function Ul(e) {
  var t = Af(e), n = (Xn || e.f & qt) && e.deps !== null ? gr : mt;
  rn(e, n), e.equals(t) || (e.v = t, e.wv = tu());
}
function Ni(e) {
  console.warn("https://svelte.dev/e/hydration_mismatch");
}
let Pe = !1;
function It(e) {
  Pe = e;
}
let De;
function Ct(e) {
  if (e === null)
    throw Ni(), _r;
  return De = e;
}
function yn() {
  return Ct(
    /** @type {TemplateNode} */
    /* @__PURE__ */ xn(De)
  );
}
function Z(e) {
  if (Pe) {
    if (/* @__PURE__ */ xn(De) !== null)
      throw Ni(), _r;
    De = e;
  }
}
function Se(e = 1) {
  if (Pe) {
    for (var t = e, n = De; t--; )
      n = /** @type {TemplateNode} */
      /* @__PURE__ */ xn(n);
    De = n;
  }
}
function hs() {
  for (var e = 0, t = De; ; ) {
    if (t.nodeType === 8) {
      var n = (
        /** @type {Comment} */
        t.data
      );
      if (n === Bs) {
        if (e === 0) return t;
        e -= 1;
      } else (n === zs || n === Rs) && (e += 1);
    }
    var r = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ xn(t)
    );
    t.remove(), t = r;
  }
}
function Tt(e, t = null, n) {
  if (typeof e != "object" || e === null || Wn in e)
    return e;
  const r = Fs(e);
  if (r !== wf && r !== _f)
    return e;
  var o = /* @__PURE__ */ new Map(), i = Co(e), s = Mt(0);
  i && o.set("length", Mt(
    /** @type {any[]} */
    e.length
  ));
  var a;
  return new Proxy(
    /** @type {any} */
    e,
    {
      defineProperty(l, u, c) {
        (!("value" in c) || c.configurable === !1 || c.enumerable === !1 || c.writable === !1) && Mf();
        var f = o.get(u);
        return f === void 0 ? (f = Mt(c.value), o.set(u, f)) : U(f, Tt(c.value, a)), !0;
      },
      deleteProperty(l, u) {
        var c = o.get(u);
        if (c === void 0)
          u in l && o.set(u, Mt(Pt));
        else {
          if (i && typeof u == "string") {
            var f = (
              /** @type {Source<number>} */
              o.get("length")
            ), d = Number(u);
            Number.isInteger(d) && d < f.v && U(f, d);
          }
          U(c, Pt), Va(s);
        }
        return !0;
      },
      get(l, u, c) {
        var p;
        if (u === Wn)
          return e;
        var f = o.get(u), d = u in l;
        if (f === void 0 && (!d || (p = Tn(l, u)) != null && p.writable) && (f = Mt(Tt(d ? l[u] : Pt, a)), o.set(u, f)), f !== void 0) {
          var g = h(f);
          return g === Pt ? void 0 : g;
        }
        return Reflect.get(l, u, c);
      },
      getOwnPropertyDescriptor(l, u) {
        var c = Reflect.getOwnPropertyDescriptor(l, u);
        if (c && "value" in c) {
          var f = o.get(u);
          f && (c.value = h(f));
        } else if (c === void 0) {
          var d = o.get(u), g = d == null ? void 0 : d.v;
          if (d !== void 0 && g !== Pt)
            return {
              enumerable: !0,
              configurable: !0,
              value: g,
              writable: !0
            };
        }
        return c;
      },
      has(l, u) {
        var g;
        if (u === Wn)
          return !0;
        var c = o.get(u), f = c !== void 0 && c.v !== Pt || Reflect.has(l, u);
        if (c !== void 0 || qe !== null && (!f || (g = Tn(l, u)) != null && g.writable)) {
          c === void 0 && (c = Mt(f ? Tt(l[u], a) : Pt), o.set(u, c));
          var d = h(c);
          if (d === Pt)
            return !1;
        }
        return f;
      },
      set(l, u, c, f) {
        var _;
        var d = o.get(u), g = u in l;
        if (i && u === "length")
          for (var p = c; p < /** @type {Source<number>} */
          d.v; p += 1) {
            var x = o.get(p + "");
            x !== void 0 ? U(x, Pt) : p in l && (x = Mt(Pt), o.set(p + "", x));
          }
        d === void 0 ? (!g || (_ = Tn(l, u)) != null && _.writable) && (d = Mt(void 0), U(d, Tt(c, a)), o.set(u, d)) : (g = d.v !== Pt, U(d, Tt(c, a)));
        var C = Reflect.getOwnPropertyDescriptor(l, u);
        if (C != null && C.set && C.set.call(f, c), !g) {
          if (i && typeof u == "string") {
            var $ = (
              /** @type {Source<number>} */
              o.get("length")
            ), m = Number(u);
            Number.isInteger(m) && m >= $.v && U($, m + 1);
          }
          Va(s);
        }
        return !0;
      },
      ownKeys(l) {
        h(s);
        var u = Reflect.ownKeys(l).filter((d) => {
          var g = o.get(d);
          return g === void 0 || g.v !== Pt;
        });
        for (var [c, f] of o)
          f.v !== Pt && !(c in l) && u.push(c);
        return u;
      },
      setPrototypeOf() {
        Tf();
      }
    }
  );
}
function Va(e, t = 1) {
  U(e, e.v + t);
}
var Nt, jl, Jl, Ql;
function vs() {
  if (Nt === void 0) {
    Nt = window, jl = /Firefox/.test(navigator.userAgent);
    var e = Element.prototype, t = Node.prototype;
    Jl = Tn(t, "firstChild").get, Ql = Tn(t, "nextSibling").get, e.__click = void 0, e.__className = void 0, e.__attributes = null, e.__styles = null, e.__e = void 0, Text.prototype.__t = void 0;
  }
}
function Vn(e = "") {
  return document.createTextNode(e);
}
// @__NO_SIDE_EFFECTS__
function bt(e) {
  return Jl.call(e);
}
// @__NO_SIDE_EFFECTS__
function xn(e) {
  return Ql.call(e);
}
function X(e, t) {
  if (!Pe)
    return /* @__PURE__ */ bt(e);
  var n = (
    /** @type {TemplateNode} */
    /* @__PURE__ */ bt(De)
  );
  if (n === null)
    n = De.appendChild(Vn());
  else if (t && n.nodeType !== 3) {
    var r = Vn();
    return n == null || n.before(r), Ct(r), r;
  }
  return Ct(n), n;
}
function be(e, t) {
  if (!Pe) {
    var n = (
      /** @type {DocumentFragment} */
      /* @__PURE__ */ bt(
        /** @type {Node} */
        e
      )
    );
    return n instanceof Comment && n.data === "" ? /* @__PURE__ */ xn(n) : n;
  }
  return De;
}
function z(e, t = 1, n = !1) {
  let r = Pe ? De : e;
  for (var o; t--; )
    o = r, r = /** @type {TemplateNode} */
    /* @__PURE__ */ xn(r);
  if (!Pe)
    return r;
  var i = r == null ? void 0 : r.nodeType;
  if (n && i !== 3) {
    var s = Vn();
    return r === null ? o == null || o.after(s) : r.before(s), Ct(s), s;
  }
  return Ct(r), /** @type {TemplateNode} */
  r;
}
function qs(e) {
  e.textContent = "";
}
let qo = !1, oi = !1, ii = null, ir = !1, Gs = !1;
function Da(e) {
  Gs = e;
}
let oo = [];
let je = null, en = !1;
function jn(e) {
  je = e;
}
let qe = null;
function Jn(e) {
  qe = e;
}
let vn = null;
function Lf(e) {
  vn = e;
}
let _t = null, Lt = 0, En = null;
function Of(e) {
  En = e;
}
let eu = 1, si = 0, Xn = !1;
function tu() {
  return ++eu;
}
function Xr(e) {
  var f;
  var t = e.f;
  if (t & In)
    return !0;
  if (t & gr) {
    var n = e.deps, r = (t & qt) !== 0;
    if (n !== null) {
      var o, i, s = (t & ni) !== 0, a = r && qe !== null && !Xn, l = n.length;
      if (s || a) {
        var u = (
          /** @type {Derived} */
          e
        ), c = u.parent;
        for (o = 0; o < l; o++)
          i = n[o], (s || !((f = i == null ? void 0 : i.reactions) != null && f.includes(u))) && (i.reactions ?? (i.reactions = [])).push(u);
        s && (u.f ^= ni), a && c !== null && !(c.f & qt) && (u.f ^= qt);
      }
      for (o = 0; o < l; o++)
        if (i = n[o], Xr(
          /** @type {Derived} */
          i
        ) && Ul(
          /** @type {Derived} */
          i
        ), i.wv > e.wv)
          return !0;
    }
    (!r || qe !== null && !Xn) && rn(e, mt);
  }
  return !1;
}
function If(e, t) {
  for (var n = t; n !== null; ) {
    if (n.f & ti)
      try {
        n.fn(e);
        return;
      } catch {
        n.f ^= ti;
      }
    n = n.parent;
  }
  throw qo = !1, e;
}
function zf(e) {
  return (e.f & Pi) === 0 && (e.parent === null || (e.parent.f & ti) === 0);
}
function Mi(e, t, n, r) {
  if (qo) {
    if (n === null && (qo = !1), zf(t))
      throw e;
    return;
  }
  n !== null && (qo = !0);
  {
    If(e, t);
    return;
  }
}
function nu(e, t, n = !0) {
  var r = e.reactions;
  if (r !== null)
    for (var o = 0; o < r.length; o++) {
      var i = r[o];
      i.f & nn ? nu(
        /** @type {Derived} */
        i,
        t,
        !1
      ) : t === i && (n ? rn(i, In) : i.f & mt && rn(i, gr), Hi(
        /** @type {Effect} */
        i
      ));
    }
}
function ru(e) {
  var g;
  var t = _t, n = Lt, r = En, o = je, i = Xn, s = vn, a = Ze, l = en, u = e.f;
  _t = /** @type {null | Value[]} */
  null, Lt = 0, En = null, Xn = (u & qt) !== 0 && (en || !ir || je === null), je = u & (On | Yr) ? null : e, vn = null, Aa(e.ctx), en = !1, si++;
  try {
    var c = (
      /** @type {Function} */
      (0, e.fn)()
    ), f = e.deps;
    if (_t !== null) {
      var d;
      if (ai(e, Lt), f !== null && Lt > 0)
        for (f.length = Lt + _t.length, d = 0; d < _t.length; d++)
          f[Lt + d] = _t[d];
      else
        e.deps = f = _t;
      if (!Xn)
        for (d = Lt; d < f.length; d++)
          ((g = f[d]).reactions ?? (g.reactions = [])).push(e);
    } else f !== null && Lt < f.length && (ai(e, Lt), f.length = Lt);
    if (Di() && En !== null && !en && f !== null && !(e.f & (nn | gr | In)))
      for (d = 0; d < /** @type {Source[]} */
      En.length; d++)
        nu(
          En[d],
          /** @type {Effect} */
          e
        );
    return o !== null && si++, c;
  } finally {
    _t = t, Lt = n, En = r, je = o, Xn = i, vn = s, Aa(a), en = l;
  }
}
function Rf(e, t) {
  let n = t.reactions;
  if (n !== null) {
    var r = yf.call(n, e);
    if (r !== -1) {
      var o = n.length - 1;
      o === 0 ? n = t.reactions = null : (n[r] = n[o], n.pop());
    }
  }
  n === null && t.f & nn && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (_t === null || !_t.includes(t)) && (rn(t, gr), t.f & (qt | ni) || (t.f ^= ni), Gl(
    /** @type {Derived} **/
    t
  ), ai(
    /** @type {Derived} **/
    t,
    0
  ));
}
function ai(e, t) {
  var n = e.deps;
  if (n !== null)
    for (var r = t; r < n.length; r++)
      Rf(e, n[r]);
}
function Ti(e) {
  var t = e.f;
  if (!(t & Pi)) {
    rn(e, mt);
    var n = qe, r = Ze, o = ir;
    qe = e, ir = !0;
    try {
      t & Ys ? Gf(e) : lu(e), au(e);
      var i = ru(e);
      e.teardown = typeof i == "function" ? i : null, e.wv = eu;
      var s = e.deps, a;
      Ma && of && e.f & In;
    } catch (l) {
      Mi(l, e, n, r || e.ctx);
    } finally {
      ir = o, qe = n;
    }
  }
}
function Bf() {
  try {
    Sf();
  } catch (e) {
    if (ii !== null)
      Mi(e, ii, null);
    else
      throw e;
  }
}
function ou() {
  var e = ir;
  try {
    var t = 0;
    for (ir = !0; oo.length > 0; ) {
      t++ > 1e3 && Bf();
      var n = oo, r = n.length;
      oo = [];
      for (var o = 0; o < r; o++) {
        var i = n[o];
        i.f & mt || (i.f ^= mt);
        var s = Zf(i);
        Yf(s);
      }
    }
  } finally {
    oi = !1, ir = e, ii = null;
  }
}
function Yf(e) {
  var t = e.length;
  if (t !== 0)
    for (var n = 0; n < t; n++) {
      var r = e[n];
      if (!(r.f & (Pi | Mn)))
        try {
          Xr(r) && (Ti(r), r.deps === null && r.first === null && r.nodes_start === null && (r.teardown === null ? uu(r) : r.fn = null));
        } catch (o) {
          Mi(o, r, null, r.ctx);
        }
    }
}
function Hi(e) {
  oi || (oi = !0, queueMicrotask(ou));
  for (var t = ii = e; t.parent !== null; ) {
    t = t.parent;
    var n = t.f;
    if (n & (Yr | On)) {
      if (!(n & mt)) return;
      t.f ^= mt;
    }
  }
  oo.push(t);
}
function Zf(e) {
  for (var t = [], n = e.first; n !== null; ) {
    var r = n.f, o = (r & On) !== 0, i = o && (r & mt) !== 0;
    if (!i && !(r & Mn)) {
      if (r & Bl)
        t.push(n);
      else if (o)
        n.f ^= mt;
      else {
        var s = je;
        try {
          je = n, Xr(n) && Ti(n);
        } catch (u) {
          Mi(u, n, null, n.ctx);
        } finally {
          je = s;
        }
      }
      var a = n.first;
      if (a !== null) {
        n = a;
        continue;
      }
    }
    var l = n.parent;
    for (n = n.next; n === null && l !== null; )
      n = l.next, l = l.parent;
  }
  return t;
}
function y(e) {
  var t;
  for (Ta(); oo.length > 0; )
    oi = !0, ou(), Ta();
  return (
    /** @type {T} */
    t
  );
}
function h(e) {
  var t = e.f, n = (t & nn) !== 0;
  if (je !== null && !en) {
    vn !== null && vn.includes(e) && Hf();
    var r = je.deps;
    e.rv < si && (e.rv = si, _t === null && r !== null && r[Lt] === e ? Lt++ : _t === null ? _t = [e] : (!Xn || !_t.includes(e)) && _t.push(e));
  } else if (n && /** @type {Derived} */
  e.deps === null && /** @type {Derived} */
  e.effects === null) {
    var o = (
      /** @type {Derived} */
      e
    ), i = o.parent;
    i !== null && !(i.f & qt) && (o.f ^= qt);
  }
  return n && (o = /** @type {Derived} */
  e, Xr(o) && Ul(o)), e.v;
}
function wn(e) {
  var t = en;
  try {
    return en = !0, e();
  } finally {
    en = t;
  }
}
const Xf = -7169;
function rn(e, t) {
  e.f = e.f & Xf | t;
}
function j(e) {
  if (!(typeof e != "object" || !e || e instanceof EventTarget)) {
    if (Wn in e)
      ps(e);
    else if (!Array.isArray(e))
      for (let t in e) {
        const n = e[t];
        typeof n == "object" && n && Wn in n && ps(n);
      }
  }
}
function ps(e, t = /* @__PURE__ */ new Set()) {
  if (typeof e == "object" && e !== null && // We don't want to traverse DOM elements
  !(e instanceof EventTarget) && !t.has(e)) {
    t.add(e), e instanceof Date && e.getTime();
    for (let r in e)
      try {
        ps(e[r], t);
      } catch {
      }
    const n = Fs(e);
    if (n !== Object.prototype && n !== Array.prototype && n !== Map.prototype && n !== Set.prototype && n !== Date.prototype) {
      const r = Zl(n);
      for (let o in r) {
        const i = r[o].get;
        if (i)
          try {
            i.call(e);
          } catch {
          }
      }
    }
  }
}
function iu(e) {
  qe === null && je === null && Ef(), je !== null && je.f & qt && qe === null && $f(), Gs && kf();
}
function Ff(e, t) {
  var n = t.last;
  n === null ? t.last = t.first = e : (n.next = e, e.prev = n, t.last = e);
}
function hr(e, t, n, r = !0) {
  var o = (e & Yr) !== 0, i = qe, s = {
    ctx: Ze,
    deps: null,
    nodes_start: null,
    nodes_end: null,
    f: e | In,
    first: null,
    fn: t,
    last: null,
    next: null,
    parent: o ? null : i,
    prev: null,
    teardown: null,
    transitions: null,
    wv: 0
  };
  if (n)
    try {
      Ti(s), s.f |= hf;
    } catch (u) {
      throw Gt(s), u;
    }
  else t !== null && Hi(s);
  var a = n && s.deps === null && s.first === null && s.nodes_start === null && s.teardown === null && (s.f & (Yl | ti)) === 0;
  if (!a && !o && r && (i !== null && Ff(s, i), je !== null && je.f & nn)) {
    var l = (
      /** @type {Derived} */
      je
    );
    (l.effects ?? (l.effects = [])).push(s);
  }
  return s;
}
function su(e) {
  const t = hr(Si, null, !1);
  return rn(t, mt), t.teardown = e, t;
}
function Nr(e) {
  iu();
  var t = qe !== null && (qe.f & On) !== 0 && Ze !== null && !Ze.m;
  if (t) {
    var n = (
      /** @type {ComponentContext} */
      Ze
    );
    (n.e ?? (n.e = [])).push({
      fn: e,
      effect: qe,
      reaction: je
    });
  } else {
    var r = Ot(e);
    return r;
  }
}
function Wf(e) {
  return iu(), Fr(e);
}
function Kf(e) {
  const t = hr(Yr, e, !0);
  return () => {
    Gt(t);
  };
}
function qf(e) {
  const t = hr(Yr, e, !0);
  return (n = {}) => new Promise((r) => {
    n.outro ? Mr(t, () => {
      Gt(t), r(void 0);
    }) : (Gt(t), r(void 0));
  });
}
function Ot(e) {
  return hr(Bl, e, !1);
}
function he(e, t) {
  var n = (
    /** @type {ComponentContextLegacy} */
    Ze
  ), r = { effect: null, ran: !1 };
  n.l.r1.push(r), r.effect = Fr(() => {
    e(), !r.ran && (r.ran = !0, U(n.l.r2, !0), wn(t));
  });
}
function gt() {
  var e = (
    /** @type {ComponentContextLegacy} */
    Ze
  );
  Fr(() => {
    if (h(e.l.r2)) {
      for (var t of e.l.r1) {
        var n = t.effect;
        n.f & mt && rn(n, gr), Xr(n) && Ti(n), t.ran = !1;
      }
      e.l.r2.v = !1;
    }
  });
}
function Fr(e) {
  return hr(Si, e, !0);
}
function Ee(e, t = [], n = Me) {
  const r = t.map(n);
  return vr(() => e(...r.map(h)));
}
function vr(e, t = 0) {
  return hr(Si | Ys | t, e, !0);
}
function Dn(e, t = !0) {
  return hr(Si | On, e, !0, t);
}
function au(e) {
  var t = e.teardown;
  if (t !== null) {
    const n = Gs, r = je;
    Da(!0), jn(null);
    try {
      t.call(null);
    } finally {
      Da(n), jn(r);
    }
  }
}
function lu(e, t = !1) {
  var n = e.first;
  for (e.first = e.last = null; n !== null; ) {
    var r = n.next;
    Gt(n, t), n = r;
  }
}
function Gf(e) {
  for (var t = e.first; t !== null; ) {
    var n = t.next;
    t.f & On || Gt(t), t = n;
  }
}
function Gt(e, t = !0) {
  var n = !1;
  if ((t || e.f & pf) && e.nodes_start !== null) {
    for (var r = e.nodes_start, o = e.nodes_end; r !== null; ) {
      var i = r === o ? null : (
        /** @type {TemplateNode} */
        /* @__PURE__ */ xn(r)
      );
      r.remove(), r = i;
    }
    n = !0;
  }
  lu(e, t && !n), ai(e, 0), rn(e, Pi);
  var s = e.transitions;
  if (s !== null)
    for (const l of s)
      l.stop();
  au(e);
  var a = e.parent;
  a !== null && a.first !== null && uu(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes_start = e.nodes_end = null;
}
function uu(e) {
  var t = e.parent, n = e.prev, r = e.next;
  n !== null && (n.next = r), r !== null && (r.prev = n), t !== null && (t.first === e && (t.first = r), t.last === e && (t.last = n));
}
function Mr(e, t) {
  var n = [];
  Us(e, n, !0), cu(n, () => {
    Gt(e), t && t();
  });
}
function cu(e, t) {
  var n = e.length;
  if (n > 0) {
    var r = () => --n || t();
    for (var o of e)
      o.out(r);
  } else
    t();
}
function Us(e, t, n) {
  if (!(e.f & Mn)) {
    if (e.f ^= Mn, e.transitions !== null)
      for (const s of e.transitions)
        (s.is_global || n) && t.push(s);
    for (var r = e.first; r !== null; ) {
      var o = r.next, i = (r.f & Zr) !== 0 || (r.f & On) !== 0;
      Us(r, t, i ? n : !1), r = o;
    }
  }
}
function co(e) {
  du(e, !0);
}
function du(e, t) {
  if (e.f & Mn) {
    e.f ^= Mn, e.f & mt || (e.f ^= mt), Xr(e) && (rn(e, In), Hi(e));
    for (var n = e.first; n !== null; ) {
      var r = n.next, o = (n.f & Zr) !== 0 || (n.f & On) !== 0;
      du(n, o ? t : !1), n = r;
    }
    if (e.transitions !== null)
      for (const i of e.transitions)
        (i.is_global || t) && i.in();
  }
}
function Vi(e) {
  throw new Error("https://svelte.dev/e/lifecycle_outside_component");
}
let Ze = null;
function Aa(e) {
  Ze = e;
}
function ar(e) {
  return (
    /** @type {T} */
    js().get(e)
  );
}
function Tr(e, t) {
  return js().set(e, t), t;
}
function Uf(e) {
  return js().has(e);
}
function de(e, t = !1, n) {
  Ze = {
    p: Ze,
    c: null,
    e: null,
    m: !1,
    s: e,
    x: null,
    l: null
  }, Br && !t && (Ze.l = {
    s: null,
    u: null,
    r1: [],
    r2: Mt(!1)
  });
}
function fe(e) {
  const t = Ze;
  if (t !== null) {
    e !== void 0 && (t.x = e);
    const s = t.e;
    if (s !== null) {
      var n = qe, r = je;
      t.e = null;
      try {
        for (var o = 0; o < s.length; o++) {
          var i = s[o];
          Jn(i.effect), jn(i.reaction), Ot(i.fn);
        }
      } finally {
        Jn(n), jn(r);
      }
    }
    Ze = t.p, t.m = !0;
  }
  return e || /** @type {T} */
  {};
}
function Di() {
  return !Br || Ze !== null && Ze.l === null;
}
function js(e) {
  return Ze === null && Vi(), Ze.c ?? (Ze.c = new Map(jf(Ze) || void 0));
}
function jf(e) {
  let t = e.p;
  for (; t !== null; ) {
    const n = t.c;
    if (n !== null)
      return n;
    t = t.p;
  }
  return null;
}
function Jf(e) {
  return e.endsWith("capture") && e !== "gotpointercapture" && e !== "lostpointercapture";
}
const Qf = [
  "beforeinput",
  "click",
  "change",
  "dblclick",
  "contextmenu",
  "focusin",
  "focusout",
  "input",
  "keydown",
  "keyup",
  "mousedown",
  "mousemove",
  "mouseout",
  "mouseover",
  "mouseup",
  "pointerdown",
  "pointermove",
  "pointerout",
  "pointerover",
  "pointerup",
  "touchend",
  "touchmove",
  "touchstart"
];
function e1(e) {
  return Qf.includes(e);
}
const t1 = {
  // no `class: 'className'` because we handle that separately
  formnovalidate: "formNoValidate",
  ismap: "isMap",
  nomodule: "noModule",
  playsinline: "playsInline",
  readonly: "readOnly",
  defaultvalue: "defaultValue",
  defaultchecked: "defaultChecked",
  srcobject: "srcObject",
  novalidate: "noValidate",
  allowfullscreen: "allowFullscreen",
  disablepictureinpicture: "disablePictureInPicture",
  disableremoteplayback: "disableRemotePlayback"
};
function n1(e) {
  return e = e.toLowerCase(), t1[e] ?? e;
}
const r1 = ["touchstart", "touchmove"];
function o1(e) {
  return r1.includes(e);
}
const i1 = (
  /** @type {const} */
  ["textarea", "script", "style", "title"]
);
function s1(e) {
  return i1.includes(
    /** @type {RAW_TEXT_ELEMENTS[number]} */
    e
  );
}
function a1(e, t) {
  if (t) {
    const n = document.body;
    e.autofocus = !0, ko(() => {
      document.activeElement === n && e.focus();
    });
  }
}
function l1(e) {
  Pe && /* @__PURE__ */ bt(e) !== null && qs(e);
}
let La = !1;
function u1() {
  La || (La = !0, document.addEventListener(
    "reset",
    (e) => {
      Promise.resolve().then(() => {
        var t;
        if (!e.defaultPrevented)
          for (
            const n of
            /**@type {HTMLFormElement} */
            e.target.elements
          )
            (t = n.__on_r) == null || t.call(n);
      });
    },
    // In the capture phase to guarantee we get noticed of it (no possiblity of stopPropagation)
    { capture: !0 }
  ));
}
function c1(e) {
  var t = je, n = qe;
  jn(null), Jn(null);
  try {
    return e();
  } finally {
    jn(t), Jn(n);
  }
}
const fu = /* @__PURE__ */ new Set(), ms = /* @__PURE__ */ new Set();
function gu(e, t, n, r = {}) {
  function o(i) {
    if (r.capture || eo.call(t, i), !i.cancelBubble)
      return c1(() => n == null ? void 0 : n.call(this, i));
  }
  return e.startsWith("pointer") || e.startsWith("touch") || e === "wheel" ? ko(() => {
    t.addEventListener(e, o, r);
  }) : t.addEventListener(e, o, r), o;
}
function Ye(e, t, n, r, o) {
  var i = { capture: r, passive: o }, s = gu(e, t, n, i);
  (t === document.body || t === window || t === document) && su(() => {
    t.removeEventListener(e, s, i);
  });
}
function Ai(e) {
  for (var t = 0; t < e.length; t++)
    fu.add(e[t]);
  for (var n of ms)
    n(e);
}
function eo(e) {
  var m;
  var t = this, n = (
    /** @type {Node} */
    t.ownerDocument
  ), r = e.type, o = ((m = e.composedPath) == null ? void 0 : m.call(e)) || [], i = (
    /** @type {null | Element} */
    o[0] || e.target
  ), s = 0, a = e.__root;
  if (a) {
    var l = o.indexOf(a);
    if (l !== -1 && (t === document || t === /** @type {any} */
    window)) {
      e.__root = t;
      return;
    }
    var u = o.indexOf(t);
    if (u === -1)
      return;
    l <= u && (s = l);
  }
  if (i = /** @type {Element} */
  o[s] || e.target, i !== t) {
    so(e, "currentTarget", {
      configurable: !0,
      get() {
        return i || n;
      }
    });
    var c = je, f = qe;
    jn(null), Jn(null);
    try {
      for (var d, g = []; i !== null; ) {
        var p = i.assignedSlot || i.parentNode || /** @type {any} */
        i.host || null;
        try {
          var x = i["__" + r];
          if (x !== void 0 && (!/** @type {any} */
          i.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          e.target === i))
            if (Co(x)) {
              var [C, ...$] = x;
              C.apply(i, [e, ...$]);
            } else
              x.call(i, e);
        } catch (_) {
          d ? g.push(_) : d = _;
        }
        if (e.cancelBubble || p === t || p === null)
          break;
        i = p;
      }
      if (d) {
        for (let _ of g)
          queueMicrotask(() => {
            throw _;
          });
        throw d;
      }
    } finally {
      e.__root = t, delete e.currentTarget, jn(c), Jn(f);
    }
  }
}
function Js(e) {
  var t = document.createElement("template");
  return t.innerHTML = e, t.content;
}
function Vt(e, t) {
  var n = (
    /** @type {Effect} */
    qe
  );
  n.nodes_start === null && (n.nodes_start = e, n.nodes_end = t);
}
// @__NO_SIDE_EFFECTS__
function ne(e, t) {
  var n = (t & zl) !== 0, r = (t & gf) !== 0, o, i = !e.startsWith("<!>");
  return () => {
    if (Pe)
      return Vt(De, null), De;
    o === void 0 && (o = Js(i ? e : "<!>" + e), n || (o = /** @type {Node} */
    /* @__PURE__ */ bt(o)));
    var s = (
      /** @type {TemplateNode} */
      r || jl ? document.importNode(o, !0) : o.cloneNode(!0)
    );
    if (n) {
      var a = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ bt(s)
      ), l = (
        /** @type {TemplateNode} */
        s.lastChild
      );
      Vt(a, l);
    } else
      Vt(s, s);
    return s;
  };
}
// @__NO_SIDE_EFFECTS__
function _e(e, t, n = "svg") {
  var r = !e.startsWith("<!>"), o = (t & zl) !== 0, i = `<${n}>${r ? e : "<!>" + e}</${n}>`, s;
  return () => {
    if (Pe)
      return Vt(De, null), De;
    if (!s) {
      var a = (
        /** @type {DocumentFragment} */
        Js(i)
      ), l = (
        /** @type {Element} */
        /* @__PURE__ */ bt(a)
      );
      if (o)
        for (s = document.createDocumentFragment(); /* @__PURE__ */ bt(l); )
          s.appendChild(
            /** @type {Node} */
            /* @__PURE__ */ bt(l)
          );
      else
        s = /** @type {Element} */
        /* @__PURE__ */ bt(l);
    }
    var u = (
      /** @type {TemplateNode} */
      s.cloneNode(!0)
    );
    if (o) {
      var c = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ bt(u)
      ), f = (
        /** @type {TemplateNode} */
        u.lastChild
      );
      Vt(c, f);
    } else
      Vt(u, u);
    return u;
  };
}
function Ie(e = "") {
  if (!Pe) {
    var t = Vn(e + "");
    return Vt(t, t), t;
  }
  var n = De;
  return n.nodeType !== 3 && (n.before(n = Vn()), Ct(n)), Vt(n, n), n;
}
function et() {
  if (Pe)
    return Vt(De, null), De;
  var e = document.createDocumentFragment(), t = document.createComment(""), n = Vn();
  return e.append(t, n), Vt(t, n), e;
}
function L(e, t) {
  if (Pe) {
    qe.nodes_end = De, yn();
    return;
  }
  e !== null && e.before(
    /** @type {Node} */
    t
  );
}
function Rt(e, t) {
  var n = t == null ? "" : typeof t == "object" ? t + "" : t;
  n !== (e.__t ?? (e.__t = e.nodeValue)) && (e.__t = n, e.nodeValue = n + "");
}
function hu(e, t) {
  return vu(e, t);
}
function d1(e, t) {
  vs(), t.intro = t.intro ?? !1;
  const n = t.target, r = Pe, o = De;
  try {
    for (var i = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ bt(n)
    ); i && (i.nodeType !== 8 || /** @type {Comment} */
    i.data !== zs); )
      i = /** @type {TemplateNode} */
      /* @__PURE__ */ xn(i);
    if (!i)
      throw _r;
    It(!0), Ct(
      /** @type {Comment} */
      i
    ), yn();
    const s = vu(e, { ...t, anchor: i });
    if (De === null || De.nodeType !== 8 || /** @type {Comment} */
    De.data !== Bs)
      throw Ni(), _r;
    return It(!1), /**  @type {Exports} */
    s;
  } catch (s) {
    if (s === _r)
      return t.recover === !1 && Pf(), vs(), qs(n), It(!1), hu(e, t);
    throw s;
  } finally {
    It(r), Ct(o);
  }
}
const mr = /* @__PURE__ */ new Map();
function vu(e, { target: t, anchor: n, props: r = {}, events: o, context: i, intro: s = !0 }) {
  vs();
  var a = /* @__PURE__ */ new Set(), l = (f) => {
    for (var d = 0; d < f.length; d++) {
      var g = f[d];
      if (!a.has(g)) {
        a.add(g);
        var p = o1(g);
        t.addEventListener(g, eo, { passive: p });
        var x = mr.get(g);
        x === void 0 ? (document.addEventListener(g, eo, { passive: p }), mr.set(g, 1)) : mr.set(g, x + 1);
      }
    }
  };
  l(Xs(fu)), ms.add(l);
  var u = void 0, c = qf(() => {
    var f = n ?? t.appendChild(Vn());
    return Dn(() => {
      if (i) {
        de({});
        var d = (
          /** @type {ComponentContext} */
          Ze
        );
        d.c = i;
      }
      o && (r.$$events = o), Pe && Vt(
        /** @type {TemplateNode} */
        f,
        null
      ), u = e(f, r) || {}, Pe && (qe.nodes_end = De), i && fe();
    }), () => {
      var p;
      for (var d of a) {
        t.removeEventListener(d, eo);
        var g = (
          /** @type {number} */
          mr.get(d)
        );
        --g === 0 ? (document.removeEventListener(d, eo), mr.delete(d)) : mr.set(d, g);
      }
      ms.delete(l), f !== n && ((p = f.parentNode) == null || p.removeChild(f));
    };
  });
  return ys.set(u, c), u;
}
let ys = /* @__PURE__ */ new WeakMap();
function f1(e, t) {
  const n = ys.get(e);
  return n ? (ys.delete(e), n(t)) : Promise.resolve();
}
function ke(e, t, [n, r] = [0, 0]) {
  Pe && n === 0 && yn();
  var o = e, i = null, s = null, a = Pt, l = n > 0 ? Zr : 0, u = !1;
  const c = (d, g = !0) => {
    u = !0, f(g, d);
  }, f = (d, g) => {
    if (a === (a = d)) return;
    let p = !1;
    if (Pe && r !== -1) {
      if (n === 0) {
        const C = (
          /** @type {Comment} */
          o.data
        );
        C === zs ? r = 0 : C === Rs ? r = 1 / 0 : (r = parseInt(C.substring(1)), r !== r && (r = a ? 1 / 0 : -1));
      }
      const x = r > n;
      !!a === x && (o = hs(), Ct(o), It(!1), p = !0, r = -1);
    }
    a ? (i ? co(i) : g && (i = Dn(() => g(o))), s && Mr(s, () => {
      s = null;
    })) : (s ? co(s) : g && (s = Dn(() => g(o, [n + 1, r]))), i && Mr(i, () => {
      i = null;
    })), p && It(!0);
  };
  vr(() => {
    u = !1, t(c), u || f(null, null);
  }, l), Pe && (o = De);
}
function Li(e, t) {
  return t;
}
function g1(e, t, n, r) {
  for (var o = [], i = t.length, s = 0; s < i; s++)
    Us(t[s].e, o, !0);
  var a = i > 0 && o.length === 0 && n !== null;
  if (a) {
    var l = (
      /** @type {Element} */
      /** @type {Element} */
      n.parentNode
    );
    qs(l), l.append(
      /** @type {Element} */
      n
    ), r.clear(), Bn(e, t[0].prev, t[i - 1].next);
  }
  cu(o, () => {
    for (var u = 0; u < i; u++) {
      var c = t[u];
      a || (r.delete(c.k), Bn(e, c.prev, c.next)), Gt(c.e, !a);
    }
  });
}
function Yt(e, t, n, r, o, i = null) {
  var s = e, a = { flags: t, items: /* @__PURE__ */ new Map(), first: null }, l = (t & Ol) !== 0;
  if (l) {
    var u = (
      /** @type {Element} */
      e
    );
    s = Pe ? Ct(
      /** @type {Comment | Text} */
      /* @__PURE__ */ bt(u)
    ) : u.appendChild(Vn());
  }
  Pe && yn();
  var c = null, f = !1, d = /* @__PURE__ */ pe(() => {
    var g = n();
    return Co(g) ? g : g == null ? [] : Xs(g);
  });
  vr(() => {
    var g = h(d), p = g.length;
    if (f && p === 0)
      return;
    f = p === 0;
    let x = !1;
    if (Pe) {
      var C = (
        /** @type {Comment} */
        s.data === Rs
      );
      C !== (p === 0) && (s = hs(), Ct(s), It(!1), x = !0);
    }
    if (Pe) {
      for (var $ = null, m, _ = 0; _ < p; _++) {
        if (De.nodeType === 8 && /** @type {Comment} */
        De.data === Bs) {
          s = /** @type {Comment} */
          De, x = !0, It(!1);
          break;
        }
        var v = g[_], b = r(v, _);
        m = pu(
          De,
          a,
          $,
          null,
          v,
          b,
          _,
          o,
          t,
          n
        ), a.items.set(b, m), $ = m;
      }
      p > 0 && Ct(hs());
    }
    Pe || h1(g, a, s, o, t, r, n), i !== null && (p === 0 ? c ? co(c) : c = Dn(() => i(s)) : c !== null && Mr(c, () => {
      c = null;
    })), x && It(!0), h(d);
  }), Pe && (s = De);
}
function h1(e, t, n, r, o, i, s) {
  var S, T, k, P;
  var a = (o & af) !== 0, l = (o & (Os | Is)) !== 0, u = e.length, c = t.items, f = t.first, d = f, g, p = null, x, C = [], $ = [], m, _, v, b;
  if (a)
    for (b = 0; b < u; b += 1)
      m = e[b], _ = i(m, b), v = c.get(_), v !== void 0 && ((S = v.a) == null || S.measure(), (x ?? (x = /* @__PURE__ */ new Set())).add(v));
  for (b = 0; b < u; b += 1) {
    if (m = e[b], _ = i(m, b), v = c.get(_), v === void 0) {
      var N = d ? (
        /** @type {TemplateNode} */
        d.e.nodes_start
      ) : n;
      p = pu(
        N,
        t,
        p,
        p === null ? t.first : p.next,
        m,
        _,
        b,
        r,
        o,
        s
      ), c.set(_, p), C = [], $ = [], d = p.next;
      continue;
    }
    if (l && v1(v, m, b, o), v.e.f & Mn && (co(v.e), a && ((T = v.a) == null || T.unfix(), (x ?? (x = /* @__PURE__ */ new Set())).delete(v))), v !== d) {
      if (g !== void 0 && g.has(v)) {
        if (C.length < $.length) {
          var E = $[0], M;
          p = E.prev;
          var D = C[0], V = C[C.length - 1];
          for (M = 0; M < C.length; M += 1)
            Oa(C[M], E, n);
          for (M = 0; M < $.length; M += 1)
            g.delete($[M]);
          Bn(t, D.prev, V.next), Bn(t, p, D), Bn(t, V, E), d = E, p = V, b -= 1, C = [], $ = [];
        } else
          g.delete(v), Oa(v, d, n), Bn(t, v.prev, v.next), Bn(t, v, p === null ? t.first : p.next), Bn(t, p, v), p = v;
        continue;
      }
      for (C = [], $ = []; d !== null && d.k !== _; )
        d.e.f & Mn || (g ?? (g = /* @__PURE__ */ new Set())).add(d), $.push(d), d = d.next;
      if (d === null)
        continue;
      v = d;
    }
    C.push(v), p = v, d = v.next;
  }
  if (d !== null || g !== void 0) {
    for (var A = g === void 0 ? [] : Xs(g); d !== null; )
      d.e.f & Mn || A.push(d), d = d.next;
    var O = A.length;
    if (O > 0) {
      var R = o & Ol && u === 0 ? n : null;
      if (a) {
        for (b = 0; b < O; b += 1)
          (k = A[b].a) == null || k.measure();
        for (b = 0; b < O; b += 1)
          (P = A[b].a) == null || P.fix();
      }
      g1(t, A, R, c);
    }
  }
  a && ko(() => {
    var H;
    if (x !== void 0)
      for (v of x)
        (H = v.a) == null || H.apply();
  }), qe.first = t.first && t.first.e, qe.last = p && p.e;
}
function v1(e, t, n, r) {
  r & Os && gs(e.v, t), r & Is ? gs(
    /** @type {Value<number>} */
    e.i,
    n
  ) : e.i = n;
}
function pu(e, t, n, r, o, i, s, a, l, u) {
  var c = (l & Os) !== 0, f = (l & lf) === 0, d = c ? f ? /* @__PURE__ */ $o(o) : Mt(o) : o, g = l & Is ? Mt(s) : s, p = {
    i: g,
    v: d,
    k: i,
    a: null,
    // @ts-expect-error
    e: null,
    prev: n,
    next: r
  };
  try {
    return p.e = Dn(() => a(e, d, g, u), Pe), p.e.prev = n && n.e, p.e.next = r && r.e, n === null ? t.first = p : (n.next = p, n.e.next = p.e), r !== null && (r.prev = p, r.e.prev = p.e), p;
  } finally {
  }
}
function Oa(e, t, n) {
  for (var r = e.next ? (
    /** @type {TemplateNode} */
    e.next.e.nodes_start
  ) : n, o = t ? (
    /** @type {TemplateNode} */
    t.e.nodes_start
  ) : n, i = (
    /** @type {TemplateNode} */
    e.e.nodes_start
  ); i !== r; ) {
    var s = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ xn(i)
    );
    o.before(i), i = s;
  }
}
function Bn(e, t, n) {
  t === null ? e.first = n : (t.next = n, t.e.next = n && n.e), n !== null && (n.prev = t, n.e.prev = t && t.e);
}
function mu(e, t, n, r, o) {
  var i = e, s = "", a;
  vr(() => {
    if (s === (s = t() ?? "")) {
      Pe && yn();
      return;
    }
    a !== void 0 && (Gt(a), a = void 0), s !== "" && (a = Dn(() => {
      if (Pe) {
        De.data;
        for (var l = yn(), u = l; l !== null && (l.nodeType !== 8 || /** @type {Comment} */
        l.data !== ""); )
          u = l, l = /** @type {TemplateNode} */
          /* @__PURE__ */ xn(l);
        if (l === null)
          throw Ni(), _r;
        Vt(De, u), i = Ct(l);
        return;
      }
      var c = s + "", f = Js(c);
      Vt(
        /** @type {TemplateNode} */
        /* @__PURE__ */ bt(f),
        /** @type {TemplateNode} */
        f.lastChild
      ), i.before(f);
    }));
  });
}
function pt(e, t, n, r, o) {
  var a;
  Pe && yn();
  var i = (a = t.$$slots) == null ? void 0 : a[n], s = !1;
  i === !0 && (i = t[n === "default" ? "children" : n], s = !0), i === void 0 || i(e, s ? () => r : r);
}
function p1(e) {
  const t = {};
  e.children && (t.default = !0);
  for (const n in e.$$slots)
    t[n] = !0;
  return t;
}
function lr(e, t, ...n) {
  var r = e, o = dt, i;
  vr(() => {
    o !== (o = t()) && (i && (Gt(i), i = null), i = Dn(() => (
      /** @type {SnippetFn} */
      o(r, ...n)
    )));
  }, Zr), Pe && (r = De);
}
function yu(e, t, n) {
  Pe && yn();
  var r = e, o, i;
  vr(() => {
    o !== (o = t()) && (i && (Mr(i), i = null), o && (i = Dn(() => n(r, o))));
  }, Zr), Pe && (r = De);
}
function m1(e, t, n, r, o, i) {
  let s = Pe;
  Pe && yn();
  var a, l, u = null;
  Pe && De.nodeType === 1 && (u = /** @type {Element} */
  De, yn());
  var c = (
    /** @type {TemplateNode} */
    Pe ? De : e
  ), f;
  vr(() => {
    const d = t() || null;
    var g = d === "svg" ? Rl : null;
    d !== a && (f && (d === null ? Mr(f, () => {
      f = null, l = null;
    }) : d === l ? co(f) : Gt(f)), d && d !== l && (f = Dn(() => {
      if (u = Pe ? (
        /** @type {Element} */
        u
      ) : g ? document.createElementNS(g, d) : document.createElement(d), Vt(u, u), r) {
        Pe && s1(d) && u.append(document.createComment(""));
        var p = (
          /** @type {TemplateNode} */
          Pe ? /* @__PURE__ */ bt(u) : u.appendChild(Vn())
        );
        Pe && (p === null ? It(!1) : Ct(p)), r(u, p);
      }
      qe.nodes_end = u, c.before(u);
    })), a = d, a && (l = a));
  }, Zr), s && (It(!0), Ct(c));
}
function Je(e, t) {
  ko(() => {
    var n = e.getRootNode(), r = (
      /** @type {ShadowRoot} */
      n.host ? (
        /** @type {ShadowRoot} */
        n
      ) : (
        /** @type {Document} */
        n.head ?? /** @type {Document} */
        n.ownerDocument.head
      )
    );
    if (!r.querySelector("#" + t.hash)) {
      const o = document.createElement("style");
      o.id = t.hash, o.textContent = t.code, r.appendChild(o);
    }
  });
}
function vt(e, t, n) {
  Ot(() => {
    var r = wn(() => t(e, n == null ? void 0 : n()) || {});
    if (n && (r != null && r.update)) {
      var o = !1, i = (
        /** @type {any} */
        {}
      );
      Fr(() => {
        var s = n();
        j(s), o && Ws(i, s) && (i = s, r.update(s));
      }), o = !0;
    }
    if (r != null && r.destroy)
      return () => (
        /** @type {Function} */
        r.destroy()
      );
  });
}
function wu(e) {
  var t, n, r = "";
  if (typeof e == "string" || typeof e == "number") r += e;
  else if (typeof e == "object") if (Array.isArray(e)) {
    var o = e.length;
    for (t = 0; t < o; t++) e[t] && (n = wu(e[t])) && (r && (r += " "), r += n);
  } else for (n in e) e[n] && (r && (r += " "), r += n);
  return r;
}
function y1() {
  for (var e, t, n = 0, r = "", o = arguments.length; n < o; n++) (e = arguments[n]) && (t = wu(e)) && (r && (r += " "), r += t);
  return r;
}
function bn(e) {
  return typeof e == "object" ? y1(e) : e ?? "";
}
const Ia = [...` 	
\r\f \v\uFEFF`];
function w1(e, t, n) {
  var r = e == null ? "" : "" + e;
  if (t && (r = r ? r + " " + t : t), n) {
    for (var o in n)
      if (n[o])
        r = r ? r + " " + o : o;
      else if (r.length)
        for (var i = o.length, s = 0; (s = r.indexOf(o, s)) >= 0; ) {
          var a = s + i;
          (s === 0 || Ia.includes(r[s - 1])) && (a === r.length || Ia.includes(r[a])) ? r = (s === 0 ? "" : r.substring(0, s)) + r.substring(a + 1) : s = a;
        }
  }
  return r === "" ? null : r;
}
function kt(e, t, n, r, o, i) {
  var s = e.__className;
  if (Pe || s !== n) {
    var a = w1(n, r, i);
    (!Pe || a !== e.getAttribute("class")) && (a == null ? e.removeAttribute("class") : t ? e.className = a : e.setAttribute("class", a)), e.__className = n;
  } else if (i)
    for (var l in i) {
      var u = !!i[l];
      (o == null || u !== !!o[l]) && e.classList.toggle(l, u);
    }
  return i;
}
const jr = Symbol("class");
function io(e) {
  if (Pe) {
    var t = !1, n = () => {
      if (!t) {
        if (t = !0, e.hasAttribute("value")) {
          var r = e.value;
          ce(e, "value", null), e.value = r;
        }
        if (e.hasAttribute("checked")) {
          var o = e.checked;
          ce(e, "checked", null), e.checked = o;
        }
      }
    };
    e.__on_r = n, Cf(n), u1();
  }
}
function Qi(e, t) {
  var n = e.__attributes ?? (e.__attributes = {});
  n.value === (n.value = // treat null and undefined the same for the initial value
  t ?? void 0) || // @ts-expect-error
  // `progress` elements always need their value set when it's `0`
  e.value === t && (t !== 0 || e.nodeName !== "PROGRESS") || (e.value = t ?? "");
}
function _1(e, t) {
  t ? e.hasAttribute("selected") || e.setAttribute("selected", "") : e.removeAttribute("selected");
}
function ce(e, t, n, r) {
  var o = e.__attributes ?? (e.__attributes = {});
  Pe && (o[t] = e.getAttribute(t), t === "src" || t === "srcset" || t === "href" && e.nodeName === "LINK") || o[t] !== (o[t] = n) && (t === "style" && "__styles" in e && (e.__styles = {}), t === "loading" && (e[mf] = n), n == null ? e.removeAttribute(t) : typeof n != "string" && _u(e).includes(t) ? e[t] = n : e.setAttribute(t, n));
}
function on(e, t, n, r, o = !1, i = !1, s = !1) {
  let a = Pe && i;
  a && It(!1);
  var l = t || {}, u = e.tagName === "OPTION";
  for (var c in t)
    c in n || (n[c] = null);
  n.class ? n.class = bn(n.class) : (r || n[jr]) && (n.class = null);
  var f = _u(e), d = (
    /** @type {Record<string, unknown>} **/
    e.__attributes ?? (e.__attributes = {})
  );
  for (const _ in n) {
    let v = n[_];
    if (u && _ === "value" && v == null) {
      e.value = e.__value = "", l[_] = v;
      continue;
    }
    if (_ === "class") {
      var g = e.namespaceURI === "http://www.w3.org/1999/xhtml";
      kt(e, g, v, r, t == null ? void 0 : t[jr], n[jr]), l[_] = v, l[jr] = n[jr];
      continue;
    }
    var p = l[_];
    if (v !== p) {
      l[_] = v;
      var x = _[0] + _[1];
      if (x !== "$$") {
        if (x === "on") {
          const b = {}, N = "$$" + _;
          let E = _.slice(2);
          var C = e1(E);
          if (Jf(E) && (E = E.slice(0, -7), b.capture = !0), !C && p) {
            if (v != null) continue;
            e.removeEventListener(E, l[N], b), l[N] = null;
          }
          if (v != null)
            if (C)
              e[`__${E}`] = v, Ai([E]);
            else {
              let M = function(D) {
                l[_].call(this, D);
              };
              l[N] = gu(E, e, M, b);
            }
          else C && (e[`__${E}`] = void 0);
        } else if (_ === "style" && v != null)
          e.style.cssText = v + "";
        else if (_ === "autofocus")
          a1(
            /** @type {HTMLElement} */
            e,
            !!v
          );
        else if (!i && (_ === "__value" || _ === "value" && v != null))
          e.value = e.__value = v;
        else if (_ === "selected" && u)
          _1(
            /** @type {HTMLOptionElement} */
            e,
            v
          );
        else {
          var $ = _;
          o || ($ = n1($));
          var m = $ === "defaultValue" || $ === "defaultChecked";
          if (v == null && !i && !m)
            if (d[_] = null, $ === "value" || $ === "checked") {
              let b = (
                /** @type {HTMLInputElement} */
                e
              );
              const N = t === void 0;
              if ($ === "value") {
                let E = b.defaultValue;
                b.removeAttribute($), b.defaultValue = E, b.value = b.__value = N ? E : null;
              } else {
                let E = b.defaultChecked;
                b.removeAttribute($), b.defaultChecked = E, b.checked = N ? E : !1;
              }
            } else
              e.removeAttribute(_);
          else m || f.includes($) && (i || typeof v != "string") ? e[$] = v : typeof v != "function" && ce(e, $, v);
        }
        _ === "style" && "__styles" in e && (e.__styles = {});
      }
    }
  }
  return a && It(!0), l;
}
var za = /* @__PURE__ */ new Map();
function _u(e) {
  var t = za.get(e.nodeName);
  if (t) return t;
  za.set(e.nodeName, t = []);
  for (var n, r = e, o = Element.prototype; o !== r; ) {
    n = Zl(r);
    for (var i in n)
      n[i].set && t.push(i);
    r = Fs(r);
  }
  return t;
}
function st(e, t, n, r) {
  var o = e.__styles ?? (e.__styles = {});
  o[t] !== n && (o[t] = n, n == null ? e.style.removeProperty(t) : e.style.setProperty(t, n, ""));
}
var Zn, Pr, bo, $i, xu;
const Ei = class Ei {
  /** @param {ResizeObserverOptions} options */
  constructor(t) {
    rr(this, $i);
    /** */
    rr(this, Zn, /* @__PURE__ */ new WeakMap());
    /** @type {ResizeObserver | undefined} */
    rr(this, Pr);
    /** @type {ResizeObserverOptions} */
    rr(this, bo);
    Gr(this, bo, t);
  }
  /**
   * @param {Element} element
   * @param {(entry: ResizeObserverEntry) => any} listener
   */
  observe(t, n) {
    var r = it(this, Zn).get(t) || /* @__PURE__ */ new Set();
    return r.add(n), it(this, Zn).set(t, r), Na(this, $i, xu).call(this).observe(t, it(this, bo)), () => {
      var o = it(this, Zn).get(t);
      o.delete(n), o.size === 0 && (it(this, Zn).delete(t), it(this, Pr).unobserve(t));
    };
  }
};
Zn = new WeakMap(), Pr = new WeakMap(), bo = new WeakMap(), $i = new WeakSet(), xu = function() {
  return it(this, Pr) ?? Gr(this, Pr, new ResizeObserver(
    /** @param {any} entries */
    (t) => {
      for (var n of t) {
        Ei.entries.set(n.target, n);
        for (var r of it(this, Zn).get(n.target) || [])
          r(n);
      }
    }
  ));
}, /** @static */
wt(Ei, "entries", /* @__PURE__ */ new WeakMap());
let ws = Ei;
var x1 = /* @__PURE__ */ new ws({
  box: "border-box"
});
function Ra(e, t, n) {
  var r = x1.observe(e, () => n(e[t]));
  Ot(() => (wn(() => n(e[t])), r));
}
function Ba(e, t) {
  return e === t || (e == null ? void 0 : e[Wn]) === t;
}
function An(e = {}, t, n, r) {
  return Ot(() => {
    var o, i;
    return Fr(() => {
      o = i, i = [], wn(() => {
        e !== n(...i) && (t(e, ...i), o && Ba(n(...o), e) && t(null, ...o));
      });
    }), () => {
      ko(() => {
        i && Ba(n(...i), e) && t(null, ...i);
      });
    };
  }), e;
}
function es(e) {
  return function(...t) {
    var n = (
      /** @type {Event} */
      t[0]
    );
    return n.stopPropagation(), e == null ? void 0 : e.apply(this, t);
  };
}
function He(e = !1) {
  const t = (
    /** @type {ComponentContextLegacy} */
    Ze
  ), n = t.l.u;
  if (!n) return;
  let r = () => j(t.s);
  if (e) {
    let o = 0, i = (
      /** @type {Record<string, any>} */
      {}
    );
    const s = /* @__PURE__ */ Me(() => {
      let a = !1;
      const l = t.s;
      for (const u in l)
        l[u] !== i[u] && (i[u] = l[u], a = !0);
      return a && o++, o;
    });
    r = () => h(s);
  }
  n.b.length && Wf(() => {
    Ya(t, r), ao(n.b);
  }), Nr(() => {
    const o = wn(() => n.m.map(xf));
    return () => {
      for (const i of o)
        typeof i == "function" && i();
    };
  }), n.a.length && Nr(() => {
    Ya(t, r), ao(n.a);
  });
}
function Ya(e, t) {
  if (e.l.s)
    for (const n of e.l.s) h(n);
  t();
}
function Ve(e, t) {
  var i;
  var n = (
    /** @type {Record<string, Function[] | Function>} */
    (i = e.$$events) == null ? void 0 : i[t.type]
  ), r = Co(n) ? n.slice() : n == null ? [] : [n];
  for (var o of r)
    o.call(this, t);
}
function un(e) {
  Ze === null && Vi(), Br && Ze.l !== null ? C1(Ze).m.push(e) : Nr(() => {
    const t = wn(e);
    if (typeof t == "function") return (
      /** @type {() => void} */
      t
    );
  });
}
function Qs(e) {
  Ze === null && Vi(), un(() => () => wn(e));
}
function b1(e, t, { bubbles: n = !1, cancelable: r = !1 } = {}) {
  return new CustomEvent(e, { detail: t, bubbles: n, cancelable: r });
}
function Oi() {
  const e = Ze;
  return e === null && Vi(), (t, n, r) => {
    var i;
    const o = (
      /** @type {Record<string, Function | Function[]>} */
      (i = e.s.$$events) == null ? void 0 : i[
        /** @type {any} */
        t
      ]
    );
    if (o) {
      const s = Co(o) ? o.slice() : [o], a = b1(
        /** @type {string} */
        t,
        n,
        r
      );
      for (const l of s)
        l.call(e.x, a);
      return !a.defaultPrevented;
    }
    return !0;
  };
}
function C1(e) {
  var t = (
    /** @type {ComponentContextLegacy} */
    e.l
  );
  return t.u ?? (t.u = { a: [], b: [], m: [] });
}
function ea(e, t, n) {
  if (e == null)
    return t(void 0), n && n(void 0), dt;
  const r = wn(
    () => e.subscribe(
      t,
      // @ts-expect-error
      n
    )
  );
  return r.unsubscribe ? () => r.unsubscribe() : r;
}
const yr = [];
function Ft(e, t) {
  return {
    subscribe: we(e, t).subscribe
  };
}
function we(e, t = dt) {
  let n = null;
  const r = /* @__PURE__ */ new Set();
  function o(a) {
    if (Ws(e, a) && (e = a, n)) {
      const l = !yr.length;
      for (const u of r)
        u[1](), yr.push(u, e);
      if (l) {
        for (let u = 0; u < yr.length; u += 2)
          yr[u][0](yr[u + 1]);
        yr.length = 0;
      }
    }
  }
  function i(a) {
    o(a(
      /** @type {T} */
      e
    ));
  }
  function s(a, l = dt) {
    const u = [a, l];
    return r.add(u), r.size === 1 && (n = t(o, i) || dt), a(
      /** @type {T} */
      e
    ), () => {
      r.delete(u), r.size === 0 && n && (n(), n = null);
    };
  }
  return { set: o, update: i, subscribe: s };
}
function Kn(e, t, n) {
  const r = !Array.isArray(e), o = r ? [e] : e;
  if (!o.every(Boolean))
    throw new Error("derived() expects stores as input, got a falsy value");
  const i = t.length < 2;
  return Ft(n, (s, a) => {
    let l = !1;
    const u = [];
    let c = 0, f = dt;
    const d = () => {
      if (c)
        return;
      f();
      const p = t(r ? u[0] : u, s, a);
      i ? s(p) : f = typeof p == "function" ? p : dt;
    }, g = o.map(
      (p, x) => ea(
        p,
        (C) => {
          u[x] = C, c &= ~(1 << x), l && d();
        },
        () => {
          c |= 1 << x;
        }
      )
    );
    return l = !0, d(), function() {
      ao(g), f(), l = !1;
    };
  });
}
function q(e) {
  let t;
  return ea(e, (n) => t = n)(), t;
}
let Bo = !1, _s = Symbol();
function Q(e, t, n) {
  const r = n[t] ?? (n[t] = {
    store: null,
    source: /* @__PURE__ */ $o(void 0),
    unsubscribe: dt
  });
  if (r.store !== e && !(_s in n))
    if (r.unsubscribe(), r.store = e ?? null, e == null)
      r.source.v = void 0, r.unsubscribe = dt;
    else {
      var o = !0;
      r.unsubscribe = ea(e, (i) => {
        o ? r.source.v = i : U(r.source, i);
      }), o = !1;
    }
  return e && _s in n ? q(e) : h(r.source);
}
function k1(e, t, n) {
  let r = n[t];
  return r && r.store !== e && (r.unsubscribe(), r.unsubscribe = dt), e;
}
function li(e, t) {
  return e.set(t), t;
}
function tt() {
  const e = {};
  function t() {
    su(() => {
      for (var n in e)
        e[n].unsubscribe();
      so(e, _s, {
        enumerable: !1,
        value: !0
      });
    });
  }
  return [e, t];
}
function $1(e) {
  var t = Bo;
  try {
    return Bo = !1, [e(), Bo];
  } finally {
    Bo = t;
  }
}
const E1 = {
  get(e, t) {
    if (!e.exclude.includes(t))
      return e.props[t];
  },
  set(e, t) {
    return !1;
  },
  getOwnPropertyDescriptor(e, t) {
    if (!e.exclude.includes(t) && t in e.props)
      return {
        enumerable: !0,
        configurable: !0,
        value: e.props[t]
      };
  },
  has(e, t) {
    return e.exclude.includes(t) ? !1 : t in e.props;
  },
  ownKeys(e) {
    return Reflect.ownKeys(e.props).filter((t) => !e.exclude.includes(t));
  }
};
// @__NO_SIDE_EFFECTS__
function yt(e, t, n) {
  return new Proxy(
    { props: e, exclude: t },
    E1
  );
}
const S1 = {
  get(e, t) {
    if (!e.exclude.includes(t))
      return h(e.version), t in e.special ? e.special[t]() : e.props[t];
  },
  set(e, t, n) {
    return t in e.special || (e.special[t] = w(
      {
        get [t]() {
          return e.props[t];
        }
      },
      /** @type {string} */
      t,
      Il
    )), e.special[t](n), Ha(e.version), !0;
  },
  getOwnPropertyDescriptor(e, t) {
    if (!e.exclude.includes(t) && t in e.props)
      return {
        enumerable: !0,
        configurable: !0,
        value: e.props[t]
      };
  },
  deleteProperty(e, t) {
    return e.exclude.includes(t) || (e.exclude.push(t), Ha(e.version)), !0;
  },
  has(e, t) {
    return e.exclude.includes(t) ? !1 : t in e.props;
  },
  ownKeys(e) {
    return Reflect.ownKeys(e.props).filter((t) => !e.exclude.includes(t));
  }
};
function nt(e, t) {
  return new Proxy({ props: e, exclude: t, special: {}, version: Mt(0) }, S1);
}
const P1 = {
  get(e, t) {
    let n = e.props.length;
    for (; n--; ) {
      let r = e.props[n];
      if (Ur(r) && (r = r()), typeof r == "object" && r !== null && t in r) return r[t];
    }
  },
  set(e, t, n) {
    let r = e.props.length;
    for (; r--; ) {
      let o = e.props[r];
      Ur(o) && (o = o());
      const i = Tn(o, t);
      if (i && i.set)
        return i.set(n), !0;
    }
    return !1;
  },
  getOwnPropertyDescriptor(e, t) {
    let n = e.props.length;
    for (; n--; ) {
      let r = e.props[n];
      if (Ur(r) && (r = r()), typeof r == "object" && r !== null && t in r) {
        const o = Tn(r, t);
        return o && !o.configurable && (o.configurable = !0), o;
      }
    }
  },
  has(e, t) {
    if (t === Wn || t === Zs) return !1;
    for (let n of e.props)
      if (Ur(n) && (n = n()), n != null && t in n) return !0;
    return !1;
  },
  ownKeys(e) {
    const t = [];
    for (let n of e.props) {
      Ur(n) && (n = n());
      for (const r in n)
        t.includes(r) || t.push(r);
    }
    return t;
  }
};
function ut(...e) {
  return new Proxy({ props: e }, P1);
}
function w(e, t, n, r) {
  var N;
  var o = (n & uf) !== 0, i = !Br || (n & cf) !== 0, s = (n & df) !== 0, a = (n & ff) !== 0, l = !1, u;
  s ? [u, l] = $1(() => (
    /** @type {V} */
    e[t]
  )) : u = /** @type {V} */
  e[t];
  var c = Wn in e || Zs in e, f = s && (((N = Tn(e, t)) == null ? void 0 : N.set) ?? (c && t in e && ((E) => e[t] = E))) || void 0, d = (
    /** @type {V} */
    r
  ), g = !0, p = !1, x = () => (p = !0, g && (g = !1, a ? d = wn(
    /** @type {() => V} */
    r
  ) : d = /** @type {V} */
  r), d);
  u === void 0 && r !== void 0 && (f && i && Nf(), u = x(), f && f(u));
  var C;
  if (i)
    C = () => {
      var E = (
        /** @type {V} */
        e[t]
      );
      return E === void 0 ? x() : (g = !0, p = !1, E);
    };
  else {
    var $ = (o ? Me : pe)(
      () => (
        /** @type {V} */
        e[t]
      )
    );
    $.f |= vf, C = () => {
      var E = h($);
      return E !== void 0 && (d = /** @type {V} */
      void 0), E === void 0 ? d : E;
    };
  }
  if (!(n & Il))
    return C;
  if (f) {
    var m = e.$$legacy;
    return function(E, M) {
      return arguments.length > 0 ? ((!i || !M || m || l) && f(M ? C() : E), E) : C();
    };
  }
  var _ = !1, v = /* @__PURE__ */ $o(u), b = /* @__PURE__ */ Me(() => {
    var E = C(), M = h(v);
    return _ ? (_ = !1, M) : v.v = E;
  });
  return o || (b.equals = Ks), function(E, M) {
    if (arguments.length > 0) {
      const D = M ? h(b) : i && s ? Tt(E) : E;
      return b.equals(D) || (_ = !0, U(v, D), p && d !== void 0 && (d = D), wn(() => h(b))), E;
    }
    return h(b);
  };
}
function N1(e) {
  return new M1(e);
}
var Sn, Wt;
class M1 {
  /**
   * @param {ComponentConstructorOptions & {
   *  component: any;
   * }} options
   */
  constructor(t) {
    /** @type {any} */
    rr(this, Sn);
    /** @type {Record<string, any>} */
    rr(this, Wt);
    var i;
    var n = /* @__PURE__ */ new Map(), r = (s, a) => {
      var l = /* @__PURE__ */ $o(a);
      return n.set(s, l), l;
    };
    const o = new Proxy(
      { ...t.props || {}, $$events: {} },
      {
        get(s, a) {
          return h(n.get(a) ?? r(a, Reflect.get(s, a)));
        },
        has(s, a) {
          return a === Zs ? !0 : (h(n.get(a) ?? r(a, Reflect.get(s, a))), Reflect.has(s, a));
        },
        set(s, a, l) {
          return U(n.get(a) ?? r(a, l), l), Reflect.set(s, a, l);
        }
      }
    );
    Gr(this, Wt, (t.hydrate ? d1 : hu)(t.component, {
      target: t.target,
      anchor: t.anchor,
      props: o,
      context: t.context,
      intro: t.intro ?? !1,
      recover: t.recover
    })), (!((i = t == null ? void 0 : t.props) != null && i.$$host) || t.sync === !1) && y(), Gr(this, Sn, o.$$events);
    for (const s of Object.keys(it(this, Wt)))
      s === "$set" || s === "$destroy" || s === "$on" || so(this, s, {
        get() {
          return it(this, Wt)[s];
        },
        /** @param {any} value */
        set(a) {
          it(this, Wt)[s] = a;
        },
        enumerable: !0
      });
    it(this, Wt).$set = /** @param {Record<string, any>} next */
    (s) => {
      Object.assign(o, s);
    }, it(this, Wt).$destroy = () => {
      f1(it(this, Wt));
    };
  }
  /** @param {Record<string, any>} props */
  $set(t) {
    it(this, Wt).$set(t);
  }
  /**
   * @param {string} event
   * @param {(...args: any[]) => any} callback
   * @returns {any}
   */
  $on(t, n) {
    it(this, Sn)[t] = it(this, Sn)[t] || [];
    const r = (...o) => n.call(this, ...o);
    return it(this, Sn)[t].push(r), () => {
      it(this, Sn)[t] = it(this, Sn)[t].filter(
        /** @param {any} fn */
        (o) => o !== r
      );
    };
  }
  $destroy() {
    it(this, Wt).$destroy();
  }
}
Sn = new WeakMap(), Wt = new WeakMap();
let bu;
typeof HTMLElement == "function" && (bu = class extends HTMLElement {
  /**
   * @param {*} $$componentCtor
   * @param {*} $$slots
   * @param {*} use_shadow_dom
   */
  constructor(t, n, r) {
    super();
    /** The Svelte component constructor */
    wt(this, "$$ctor");
    /** Slots */
    wt(this, "$$s");
    /** @type {any} The Svelte component instance */
    wt(this, "$$c");
    /** Whether or not the custom element is connected */
    wt(this, "$$cn", !1);
    /** @type {Record<string, any>} Component props data */
    wt(this, "$$d", {});
    /** `true` if currently in the process of reflecting component props back to attributes */
    wt(this, "$$r", !1);
    /** @type {Record<string, CustomElementPropDefinition>} Props definition (name, reflected, type etc) */
    wt(this, "$$p_d", {});
    /** @type {Record<string, EventListenerOrEventListenerObject[]>} Event listeners */
    wt(this, "$$l", {});
    /** @type {Map<EventListenerOrEventListenerObject, Function>} Event listener unsubscribe functions */
    wt(this, "$$l_u", /* @__PURE__ */ new Map());
    /** @type {any} The managed render effect for reflecting attributes */
    wt(this, "$$me");
    this.$$ctor = t, this.$$s = n, r && this.attachShadow({ mode: "open" });
  }
  /**
   * @param {string} type
   * @param {EventListenerOrEventListenerObject} listener
   * @param {boolean | AddEventListenerOptions} [options]
   */
  addEventListener(t, n, r) {
    if (this.$$l[t] = this.$$l[t] || [], this.$$l[t].push(n), this.$$c) {
      const o = this.$$c.$on(t, n);
      this.$$l_u.set(n, o);
    }
    super.addEventListener(t, n, r);
  }
  /**
   * @param {string} type
   * @param {EventListenerOrEventListenerObject} listener
   * @param {boolean | AddEventListenerOptions} [options]
   */
  removeEventListener(t, n, r) {
    if (super.removeEventListener(t, n, r), this.$$c) {
      const o = this.$$l_u.get(n);
      o && (o(), this.$$l_u.delete(n));
    }
  }
  async connectedCallback() {
    if (this.$$cn = !0, !this.$$c) {
      let t = function(o) {
        return (i) => {
          const s = document.createElement("slot");
          o !== "default" && (s.name = o), L(i, s);
        };
      };
      if (await Promise.resolve(), !this.$$cn || this.$$c)
        return;
      const n = {}, r = T1(this);
      for (const o of this.$$s)
        o in r && (o === "default" && !this.$$d.children ? (this.$$d.children = t(o), n.default = !0) : n[o] = t(o));
      for (const o of this.attributes) {
        const i = this.$$g_p(o.name);
        i in this.$$d || (this.$$d[i] = Go(i, o.value, this.$$p_d, "toProp"));
      }
      for (const o in this.$$p_d)
        !(o in this.$$d) && this[o] !== void 0 && (this.$$d[o] = this[o], delete this[o]);
      this.$$c = N1({
        component: this.$$ctor,
        target: this.shadowRoot || this,
        props: {
          ...this.$$d,
          $$slots: n,
          $$host: this
        }
      }), this.$$me = Kf(() => {
        Fr(() => {
          var o;
          this.$$r = !0;
          for (const i of ri(this.$$c)) {
            if (!((o = this.$$p_d[i]) != null && o.reflect)) continue;
            this.$$d[i] = this.$$c[i];
            const s = Go(
              i,
              this.$$d[i],
              this.$$p_d,
              "toAttribute"
            );
            s == null ? this.removeAttribute(this.$$p_d[i].attribute || i) : this.setAttribute(this.$$p_d[i].attribute || i, s);
          }
          this.$$r = !1;
        });
      });
      for (const o in this.$$l)
        for (const i of this.$$l[o]) {
          const s = this.$$c.$on(o, i);
          this.$$l_u.set(i, s);
        }
      this.$$l = {};
    }
  }
  // We don't need this when working within Svelte code, but for compatibility of people using this outside of Svelte
  // and setting attributes through setAttribute etc, this is helpful
  /**
   * @param {string} attr
   * @param {string} _oldValue
   * @param {string} newValue
   */
  attributeChangedCallback(t, n, r) {
    var o;
    this.$$r || (t = this.$$g_p(t), this.$$d[t] = Go(t, r, this.$$p_d, "toProp"), (o = this.$$c) == null || o.$set({ [t]: this.$$d[t] }));
  }
  disconnectedCallback() {
    this.$$cn = !1, Promise.resolve().then(() => {
      !this.$$cn && this.$$c && (this.$$c.$destroy(), this.$$me(), this.$$c = void 0);
    });
  }
  /**
   * @param {string} attribute_name
   */
  $$g_p(t) {
    return ri(this.$$p_d).find(
      (n) => this.$$p_d[n].attribute === t || !this.$$p_d[n].attribute && n.toLowerCase() === t
    ) || t;
  }
});
function Go(e, t, n, r) {
  var i;
  const o = (i = n[e]) == null ? void 0 : i.type;
  if (t = o === "Boolean" && typeof t != "boolean" ? t != null : t, !r || !n[e])
    return t;
  if (r === "toAttribute")
    switch (o) {
      case "Object":
      case "Array":
        return t == null ? null : JSON.stringify(t);
      case "Boolean":
        return t ? "" : null;
      case "Number":
        return t ?? null;
      default:
        return t;
    }
  else
    switch (o) {
      case "Object":
      case "Array":
        return t && JSON.parse(t);
      case "Boolean":
        return t;
      // conversion already handled above
      case "Number":
        return t != null ? +t : t;
      default:
        return t;
    }
}
function T1(e) {
  const t = {};
  return e.childNodes.forEach((n) => {
    t[
      /** @type {Element} node */
      n.slot || "default"
    ] = !0;
  }), t;
}
function ae(e, t, n, r, o, i) {
  let s = class extends bu {
    constructor() {
      super(e, n, o), this.$$p_d = t;
    }
    static get observedAttributes() {
      return ri(t).map(
        (a) => (t[a].attribute || a).toLowerCase()
      );
    }
  };
  return ri(t).forEach((a) => {
    so(s.prototype, a, {
      get() {
        return this.$$c && a in this.$$c ? this.$$c[a] : this.$$d[a];
      },
      set(l) {
        var f;
        l = Go(a, l, t), this.$$d[a] = l;
        var u = this.$$c;
        if (u) {
          var c = (f = Tn(u, a)) == null ? void 0 : f.get;
          c ? u[a] = l : u.$set({ [a]: l });
        }
      }
    });
  }), r.forEach((a) => {
    so(s.prototype, a, {
      get() {
        var l;
        return (l = this.$$c) == null ? void 0 : l[a];
      }
    });
  }), e.element = /** @type {any} */
  s, s;
}
function Et(e) {
  if (typeof e == "string" || typeof e == "number") return "" + e;
  let t = "";
  if (Array.isArray(e))
    for (let n = 0, r; n < e.length; n++)
      (r = Et(e[n])) !== "" && (t += (t && " ") + r);
  else
    for (let n in e)
      e[n] && (t += (t && " ") + n);
  return t;
}
var H1 = { value: () => {
} };
function Ii() {
  for (var e = 0, t = arguments.length, n = {}, r; e < t; ++e) {
    if (!(r = arguments[e] + "") || r in n || /[\s.]/.test(r)) throw new Error("illegal type: " + r);
    n[r] = [];
  }
  return new Uo(n);
}
function Uo(e) {
  this._ = e;
}
function V1(e, t) {
  return e.trim().split(/^|\s+/).map(function(n) {
    var r = "", o = n.indexOf(".");
    if (o >= 0 && (r = n.slice(o + 1), n = n.slice(0, o)), n && !t.hasOwnProperty(n)) throw new Error("unknown type: " + n);
    return { type: n, name: r };
  });
}
Uo.prototype = Ii.prototype = {
  constructor: Uo,
  on: function(e, t) {
    var n = this._, r = V1(e + "", n), o, i = -1, s = r.length;
    if (arguments.length < 2) {
      for (; ++i < s; ) if ((o = (e = r[i]).type) && (o = D1(n[o], e.name))) return o;
      return;
    }
    if (t != null && typeof t != "function") throw new Error("invalid callback: " + t);
    for (; ++i < s; )
      if (o = (e = r[i]).type) n[o] = Za(n[o], e.name, t);
      else if (t == null) for (o in n) n[o] = Za(n[o], e.name, null);
    return this;
  },
  copy: function() {
    var e = {}, t = this._;
    for (var n in t) e[n] = t[n].slice();
    return new Uo(e);
  },
  call: function(e, t) {
    if ((o = arguments.length - 2) > 0) for (var n = new Array(o), r = 0, o, i; r < o; ++r) n[r] = arguments[r + 2];
    if (!this._.hasOwnProperty(e)) throw new Error("unknown type: " + e);
    for (i = this._[e], r = 0, o = i.length; r < o; ++r) i[r].value.apply(t, n);
  },
  apply: function(e, t, n) {
    if (!this._.hasOwnProperty(e)) throw new Error("unknown type: " + e);
    for (var r = this._[e], o = 0, i = r.length; o < i; ++o) r[o].value.apply(t, n);
  }
};
function D1(e, t) {
  for (var n = 0, r = e.length, o; n < r; ++n)
    if ((o = e[n]).name === t)
      return o.value;
}
function Za(e, t, n) {
  for (var r = 0, o = e.length; r < o; ++r)
    if (e[r].name === t) {
      e[r] = H1, e = e.slice(0, r).concat(e.slice(r + 1));
      break;
    }
  return n != null && e.push({ name: t, value: n }), e;
}
var xs = "http://www.w3.org/1999/xhtml";
const Xa = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: xs,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};
function zi(e) {
  var t = e += "", n = t.indexOf(":");
  return n >= 0 && (t = e.slice(0, n)) !== "xmlns" && (e = e.slice(n + 1)), Xa.hasOwnProperty(t) ? { space: Xa[t], local: e } : e;
}
function A1(e) {
  return function() {
    var t = this.ownerDocument, n = this.namespaceURI;
    return n === xs && t.documentElement.namespaceURI === xs ? t.createElement(e) : t.createElementNS(n, e);
  };
}
function L1(e) {
  return function() {
    return this.ownerDocument.createElementNS(e.space, e.local);
  };
}
function Cu(e) {
  var t = zi(e);
  return (t.local ? L1 : A1)(t);
}
function O1() {
}
function ta(e) {
  return e == null ? O1 : function() {
    return this.querySelector(e);
  };
}
function I1(e) {
  typeof e != "function" && (e = ta(e));
  for (var t = this._groups, n = t.length, r = new Array(n), o = 0; o < n; ++o)
    for (var i = t[o], s = i.length, a = r[o] = new Array(s), l, u, c = 0; c < s; ++c)
      (l = i[c]) && (u = e.call(l, l.__data__, c, i)) && ("__data__" in l && (u.__data__ = l.__data__), a[c] = u);
  return new Zt(r, this._parents);
}
function z1(e) {
  return e == null ? [] : Array.isArray(e) ? e : Array.from(e);
}
function R1() {
  return [];
}
function ku(e) {
  return e == null ? R1 : function() {
    return this.querySelectorAll(e);
  };
}
function B1(e) {
  return function() {
    return z1(e.apply(this, arguments));
  };
}
function Y1(e) {
  typeof e == "function" ? e = B1(e) : e = ku(e);
  for (var t = this._groups, n = t.length, r = [], o = [], i = 0; i < n; ++i)
    for (var s = t[i], a = s.length, l, u = 0; u < a; ++u)
      (l = s[u]) && (r.push(e.call(l, l.__data__, u, s)), o.push(l));
  return new Zt(r, o);
}
function $u(e) {
  return function() {
    return this.matches(e);
  };
}
function Eu(e) {
  return function(t) {
    return t.matches(e);
  };
}
var Z1 = Array.prototype.find;
function X1(e) {
  return function() {
    return Z1.call(this.children, e);
  };
}
function F1() {
  return this.firstElementChild;
}
function W1(e) {
  return this.select(e == null ? F1 : X1(typeof e == "function" ? e : Eu(e)));
}
var K1 = Array.prototype.filter;
function q1() {
  return Array.from(this.children);
}
function G1(e) {
  return function() {
    return K1.call(this.children, e);
  };
}
function U1(e) {
  return this.selectAll(e == null ? q1 : G1(typeof e == "function" ? e : Eu(e)));
}
function j1(e) {
  typeof e != "function" && (e = $u(e));
  for (var t = this._groups, n = t.length, r = new Array(n), o = 0; o < n; ++o)
    for (var i = t[o], s = i.length, a = r[o] = [], l, u = 0; u < s; ++u)
      (l = i[u]) && e.call(l, l.__data__, u, i) && a.push(l);
  return new Zt(r, this._parents);
}
function Su(e) {
  return new Array(e.length);
}
function J1() {
  return new Zt(this._enter || this._groups.map(Su), this._parents);
}
function ui(e, t) {
  this.ownerDocument = e.ownerDocument, this.namespaceURI = e.namespaceURI, this._next = null, this._parent = e, this.__data__ = t;
}
ui.prototype = {
  constructor: ui,
  appendChild: function(e) {
    return this._parent.insertBefore(e, this._next);
  },
  insertBefore: function(e, t) {
    return this._parent.insertBefore(e, t);
  },
  querySelector: function(e) {
    return this._parent.querySelector(e);
  },
  querySelectorAll: function(e) {
    return this._parent.querySelectorAll(e);
  }
};
function Q1(e) {
  return function() {
    return e;
  };
}
function eg(e, t, n, r, o, i) {
  for (var s = 0, a, l = t.length, u = i.length; s < u; ++s)
    (a = t[s]) ? (a.__data__ = i[s], r[s] = a) : n[s] = new ui(e, i[s]);
  for (; s < l; ++s)
    (a = t[s]) && (o[s] = a);
}
function tg(e, t, n, r, o, i, s) {
  var a, l, u = /* @__PURE__ */ new Map(), c = t.length, f = i.length, d = new Array(c), g;
  for (a = 0; a < c; ++a)
    (l = t[a]) && (d[a] = g = s.call(l, l.__data__, a, t) + "", u.has(g) ? o[a] = l : u.set(g, l));
  for (a = 0; a < f; ++a)
    g = s.call(e, i[a], a, i) + "", (l = u.get(g)) ? (r[a] = l, l.__data__ = i[a], u.delete(g)) : n[a] = new ui(e, i[a]);
  for (a = 0; a < c; ++a)
    (l = t[a]) && u.get(d[a]) === l && (o[a] = l);
}
function ng(e) {
  return e.__data__;
}
function rg(e, t) {
  if (!arguments.length) return Array.from(this, ng);
  var n = t ? tg : eg, r = this._parents, o = this._groups;
  typeof e != "function" && (e = Q1(e));
  for (var i = o.length, s = new Array(i), a = new Array(i), l = new Array(i), u = 0; u < i; ++u) {
    var c = r[u], f = o[u], d = f.length, g = og(e.call(c, c && c.__data__, u, r)), p = g.length, x = a[u] = new Array(p), C = s[u] = new Array(p), $ = l[u] = new Array(d);
    n(c, f, x, C, $, g, t);
    for (var m = 0, _ = 0, v, b; m < p; ++m)
      if (v = x[m]) {
        for (m >= _ && (_ = m + 1); !(b = C[_]) && ++_ < p; ) ;
        v._next = b || null;
      }
  }
  return s = new Zt(s, r), s._enter = a, s._exit = l, s;
}
function og(e) {
  return typeof e == "object" && "length" in e ? e : Array.from(e);
}
function ig() {
  return new Zt(this._exit || this._groups.map(Su), this._parents);
}
function sg(e, t, n) {
  var r = this.enter(), o = this, i = this.exit();
  return typeof e == "function" ? (r = e(r), r && (r = r.selection())) : r = r.append(e + ""), t != null && (o = t(o), o && (o = o.selection())), n == null ? i.remove() : n(i), r && o ? r.merge(o).order() : o;
}
function ag(e) {
  for (var t = e.selection ? e.selection() : e, n = this._groups, r = t._groups, o = n.length, i = r.length, s = Math.min(o, i), a = new Array(o), l = 0; l < s; ++l)
    for (var u = n[l], c = r[l], f = u.length, d = a[l] = new Array(f), g, p = 0; p < f; ++p)
      (g = u[p] || c[p]) && (d[p] = g);
  for (; l < o; ++l)
    a[l] = n[l];
  return new Zt(a, this._parents);
}
function lg() {
  for (var e = this._groups, t = -1, n = e.length; ++t < n; )
    for (var r = e[t], o = r.length - 1, i = r[o], s; --o >= 0; )
      (s = r[o]) && (i && s.compareDocumentPosition(i) ^ 4 && i.parentNode.insertBefore(s, i), i = s);
  return this;
}
function ug(e) {
  e || (e = cg);
  function t(f, d) {
    return f && d ? e(f.__data__, d.__data__) : !f - !d;
  }
  for (var n = this._groups, r = n.length, o = new Array(r), i = 0; i < r; ++i) {
    for (var s = n[i], a = s.length, l = o[i] = new Array(a), u, c = 0; c < a; ++c)
      (u = s[c]) && (l[c] = u);
    l.sort(t);
  }
  return new Zt(o, this._parents).order();
}
function cg(e, t) {
  return e < t ? -1 : e > t ? 1 : e >= t ? 0 : NaN;
}
function dg() {
  var e = arguments[0];
  return arguments[0] = this, e.apply(null, arguments), this;
}
function fg() {
  return Array.from(this);
}
function gg() {
  for (var e = this._groups, t = 0, n = e.length; t < n; ++t)
    for (var r = e[t], o = 0, i = r.length; o < i; ++o) {
      var s = r[o];
      if (s) return s;
    }
  return null;
}
function hg() {
  let e = 0;
  for (const t of this) ++e;
  return e;
}
function vg() {
  return !this.node();
}
function pg(e) {
  for (var t = this._groups, n = 0, r = t.length; n < r; ++n)
    for (var o = t[n], i = 0, s = o.length, a; i < s; ++i)
      (a = o[i]) && e.call(a, a.__data__, i, o);
  return this;
}
function mg(e) {
  return function() {
    this.removeAttribute(e);
  };
}
function yg(e) {
  return function() {
    this.removeAttributeNS(e.space, e.local);
  };
}
function wg(e, t) {
  return function() {
    this.setAttribute(e, t);
  };
}
function _g(e, t) {
  return function() {
    this.setAttributeNS(e.space, e.local, t);
  };
}
function xg(e, t) {
  return function() {
    var n = t.apply(this, arguments);
    n == null ? this.removeAttribute(e) : this.setAttribute(e, n);
  };
}
function bg(e, t) {
  return function() {
    var n = t.apply(this, arguments);
    n == null ? this.removeAttributeNS(e.space, e.local) : this.setAttributeNS(e.space, e.local, n);
  };
}
function Cg(e, t) {
  var n = zi(e);
  if (arguments.length < 2) {
    var r = this.node();
    return n.local ? r.getAttributeNS(n.space, n.local) : r.getAttribute(n);
  }
  return this.each((t == null ? n.local ? yg : mg : typeof t == "function" ? n.local ? bg : xg : n.local ? _g : wg)(n, t));
}
function Pu(e) {
  return e.ownerDocument && e.ownerDocument.defaultView || e.document && e || e.defaultView;
}
function kg(e) {
  return function() {
    this.style.removeProperty(e);
  };
}
function $g(e, t, n) {
  return function() {
    this.style.setProperty(e, t, n);
  };
}
function Eg(e, t, n) {
  return function() {
    var r = t.apply(this, arguments);
    r == null ? this.style.removeProperty(e) : this.style.setProperty(e, r, n);
  };
}
function Sg(e, t, n) {
  return arguments.length > 1 ? this.each((t == null ? kg : typeof t == "function" ? Eg : $g)(e, t, n ?? "")) : Hr(this.node(), e);
}
function Hr(e, t) {
  return e.style.getPropertyValue(t) || Pu(e).getComputedStyle(e, null).getPropertyValue(t);
}
function Pg(e) {
  return function() {
    delete this[e];
  };
}
function Ng(e, t) {
  return function() {
    this[e] = t;
  };
}
function Mg(e, t) {
  return function() {
    var n = t.apply(this, arguments);
    n == null ? delete this[e] : this[e] = n;
  };
}
function Tg(e, t) {
  return arguments.length > 1 ? this.each((t == null ? Pg : typeof t == "function" ? Mg : Ng)(e, t)) : this.node()[e];
}
function Nu(e) {
  return e.trim().split(/^|\s+/);
}
function na(e) {
  return e.classList || new Mu(e);
}
function Mu(e) {
  this._node = e, this._names = Nu(e.getAttribute("class") || "");
}
Mu.prototype = {
  add: function(e) {
    var t = this._names.indexOf(e);
    t < 0 && (this._names.push(e), this._node.setAttribute("class", this._names.join(" ")));
  },
  remove: function(e) {
    var t = this._names.indexOf(e);
    t >= 0 && (this._names.splice(t, 1), this._node.setAttribute("class", this._names.join(" ")));
  },
  contains: function(e) {
    return this._names.indexOf(e) >= 0;
  }
};
function Tu(e, t) {
  for (var n = na(e), r = -1, o = t.length; ++r < o; ) n.add(t[r]);
}
function Hu(e, t) {
  for (var n = na(e), r = -1, o = t.length; ++r < o; ) n.remove(t[r]);
}
function Hg(e) {
  return function() {
    Tu(this, e);
  };
}
function Vg(e) {
  return function() {
    Hu(this, e);
  };
}
function Dg(e, t) {
  return function() {
    (t.apply(this, arguments) ? Tu : Hu)(this, e);
  };
}
function Ag(e, t) {
  var n = Nu(e + "");
  if (arguments.length < 2) {
    for (var r = na(this.node()), o = -1, i = n.length; ++o < i; ) if (!r.contains(n[o])) return !1;
    return !0;
  }
  return this.each((typeof t == "function" ? Dg : t ? Hg : Vg)(n, t));
}
function Lg() {
  this.textContent = "";
}
function Og(e) {
  return function() {
    this.textContent = e;
  };
}
function Ig(e) {
  return function() {
    var t = e.apply(this, arguments);
    this.textContent = t ?? "";
  };
}
function zg(e) {
  return arguments.length ? this.each(e == null ? Lg : (typeof e == "function" ? Ig : Og)(e)) : this.node().textContent;
}
function Rg() {
  this.innerHTML = "";
}
function Bg(e) {
  return function() {
    this.innerHTML = e;
  };
}
function Yg(e) {
  return function() {
    var t = e.apply(this, arguments);
    this.innerHTML = t ?? "";
  };
}
function Zg(e) {
  return arguments.length ? this.each(e == null ? Rg : (typeof e == "function" ? Yg : Bg)(e)) : this.node().innerHTML;
}
function Xg() {
  this.nextSibling && this.parentNode.appendChild(this);
}
function Fg() {
  return this.each(Xg);
}
function Wg() {
  this.previousSibling && this.parentNode.insertBefore(this, this.parentNode.firstChild);
}
function Kg() {
  return this.each(Wg);
}
function qg(e) {
  var t = typeof e == "function" ? e : Cu(e);
  return this.select(function() {
    return this.appendChild(t.apply(this, arguments));
  });
}
function Gg() {
  return null;
}
function Ug(e, t) {
  var n = typeof e == "function" ? e : Cu(e), r = t == null ? Gg : typeof t == "function" ? t : ta(t);
  return this.select(function() {
    return this.insertBefore(n.apply(this, arguments), r.apply(this, arguments) || null);
  });
}
function jg() {
  var e = this.parentNode;
  e && e.removeChild(this);
}
function Jg() {
  return this.each(jg);
}
function Qg() {
  var e = this.cloneNode(!1), t = this.parentNode;
  return t ? t.insertBefore(e, this.nextSibling) : e;
}
function eh() {
  var e = this.cloneNode(!0), t = this.parentNode;
  return t ? t.insertBefore(e, this.nextSibling) : e;
}
function th(e) {
  return this.select(e ? eh : Qg);
}
function nh(e) {
  return arguments.length ? this.property("__data__", e) : this.node().__data__;
}
function rh(e) {
  return function(t) {
    e.call(this, t, this.__data__);
  };
}
function oh(e) {
  return e.trim().split(/^|\s+/).map(function(t) {
    var n = "", r = t.indexOf(".");
    return r >= 0 && (n = t.slice(r + 1), t = t.slice(0, r)), { type: t, name: n };
  });
}
function ih(e) {
  return function() {
    var t = this.__on;
    if (t) {
      for (var n = 0, r = -1, o = t.length, i; n < o; ++n)
        i = t[n], (!e.type || i.type === e.type) && i.name === e.name ? this.removeEventListener(i.type, i.listener, i.options) : t[++r] = i;
      ++r ? t.length = r : delete this.__on;
    }
  };
}
function sh(e, t, n) {
  return function() {
    var r = this.__on, o, i = rh(t);
    if (r) {
      for (var s = 0, a = r.length; s < a; ++s)
        if ((o = r[s]).type === e.type && o.name === e.name) {
          this.removeEventListener(o.type, o.listener, o.options), this.addEventListener(o.type, o.listener = i, o.options = n), o.value = t;
          return;
        }
    }
    this.addEventListener(e.type, i, n), o = { type: e.type, name: e.name, value: t, listener: i, options: n }, r ? r.push(o) : this.__on = [o];
  };
}
function ah(e, t, n) {
  var r = oh(e + ""), o, i = r.length, s;
  if (arguments.length < 2) {
    var a = this.node().__on;
    if (a) {
      for (var l = 0, u = a.length, c; l < u; ++l)
        for (o = 0, c = a[l]; o < i; ++o)
          if ((s = r[o]).type === c.type && s.name === c.name)
            return c.value;
    }
    return;
  }
  for (a = t ? sh : ih, o = 0; o < i; ++o) this.each(a(r[o], t, n));
  return this;
}
function Vu(e, t, n) {
  var r = Pu(e), o = r.CustomEvent;
  typeof o == "function" ? o = new o(t, n) : (o = r.document.createEvent("Event"), n ? (o.initEvent(t, n.bubbles, n.cancelable), o.detail = n.detail) : o.initEvent(t, !1, !1)), e.dispatchEvent(o);
}
function lh(e, t) {
  return function() {
    return Vu(this, e, t);
  };
}
function uh(e, t) {
  return function() {
    return Vu(this, e, t.apply(this, arguments));
  };
}
function ch(e, t) {
  return this.each((typeof t == "function" ? uh : lh)(e, t));
}
function* dh() {
  for (var e = this._groups, t = 0, n = e.length; t < n; ++t)
    for (var r = e[t], o = 0, i = r.length, s; o < i; ++o)
      (s = r[o]) && (yield s);
}
var Du = [null];
function Zt(e, t) {
  this._groups = e, this._parents = t;
}
function Eo() {
  return new Zt([[document.documentElement]], Du);
}
function fh() {
  return this;
}
Zt.prototype = Eo.prototype = {
  constructor: Zt,
  select: I1,
  selectAll: Y1,
  selectChild: W1,
  selectChildren: U1,
  filter: j1,
  data: rg,
  enter: J1,
  exit: ig,
  join: sg,
  merge: ag,
  selection: fh,
  order: lg,
  sort: ug,
  call: dg,
  nodes: fg,
  node: gg,
  size: hg,
  empty: vg,
  each: pg,
  attr: Cg,
  style: Sg,
  property: Tg,
  classed: Ag,
  text: zg,
  html: Zg,
  raise: Fg,
  lower: Kg,
  append: qg,
  insert: Ug,
  remove: Jg,
  clone: th,
  datum: nh,
  on: ah,
  dispatch: ch,
  [Symbol.iterator]: dh
};
function Kt(e) {
  return typeof e == "string" ? new Zt([[document.querySelector(e)]], [document.documentElement]) : new Zt([[e]], Du);
}
function gh(e) {
  let t;
  for (; t = e.sourceEvent; ) e = t;
  return e;
}
function Qt(e, t) {
  if (e = gh(e), t === void 0 && (t = e.currentTarget), t) {
    var n = t.ownerSVGElement || t;
    if (n.createSVGPoint) {
      var r = n.createSVGPoint();
      return r.x = e.clientX, r.y = e.clientY, r = r.matrixTransform(t.getScreenCTM().inverse()), [r.x, r.y];
    }
    if (t.getBoundingClientRect) {
      var o = t.getBoundingClientRect();
      return [e.clientX - o.left - t.clientLeft, e.clientY - o.top - t.clientTop];
    }
  }
  return [e.pageX, e.pageY];
}
const hh = { passive: !1 }, fo = { capture: !0, passive: !1 };
function ts(e) {
  e.stopImmediatePropagation();
}
function xr(e) {
  e.preventDefault(), e.stopImmediatePropagation();
}
function Au(e) {
  var t = e.document.documentElement, n = Kt(e).on("dragstart.drag", xr, fo);
  "onselectstart" in t ? n.on("selectstart.drag", xr, fo) : (t.__noselect = t.style.MozUserSelect, t.style.MozUserSelect = "none");
}
function Lu(e, t) {
  var n = e.document.documentElement, r = Kt(e).on("dragstart.drag", null);
  t && (r.on("click.drag", xr, fo), setTimeout(function() {
    r.on("click.drag", null);
  }, 0)), "onselectstart" in n ? r.on("selectstart.drag", null) : (n.style.MozUserSelect = n.__noselect, delete n.__noselect);
}
const Yo = (e) => () => e;
function bs(e, {
  sourceEvent: t,
  subject: n,
  target: r,
  identifier: o,
  active: i,
  x: s,
  y: a,
  dx: l,
  dy: u,
  dispatch: c
}) {
  Object.defineProperties(this, {
    type: { value: e, enumerable: !0, configurable: !0 },
    sourceEvent: { value: t, enumerable: !0, configurable: !0 },
    subject: { value: n, enumerable: !0, configurable: !0 },
    target: { value: r, enumerable: !0, configurable: !0 },
    identifier: { value: o, enumerable: !0, configurable: !0 },
    active: { value: i, enumerable: !0, configurable: !0 },
    x: { value: s, enumerable: !0, configurable: !0 },
    y: { value: a, enumerable: !0, configurable: !0 },
    dx: { value: l, enumerable: !0, configurable: !0 },
    dy: { value: u, enumerable: !0, configurable: !0 },
    _: { value: c }
  });
}
bs.prototype.on = function() {
  var e = this._.on.apply(this._, arguments);
  return e === this._ ? this : e;
};
function vh(e) {
  return !e.ctrlKey && !e.button;
}
function ph() {
  return this.parentNode;
}
function mh(e, t) {
  return t ?? { x: e.x, y: e.y };
}
function yh() {
  return navigator.maxTouchPoints || "ontouchstart" in this;
}
function wh() {
  var e = vh, t = ph, n = mh, r = yh, o = {}, i = Ii("start", "drag", "end"), s = 0, a, l, u, c, f = 0;
  function d(v) {
    v.on("mousedown.drag", g).filter(r).on("touchstart.drag", C).on("touchmove.drag", $, hh).on("touchend.drag touchcancel.drag", m).style("touch-action", "none").style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
  }
  function g(v, b) {
    if (!(c || !e.call(this, v, b))) {
      var N = _(this, t.call(this, v, b), v, b, "mouse");
      N && (Kt(v.view).on("mousemove.drag", p, fo).on("mouseup.drag", x, fo), Au(v.view), ts(v), u = !1, a = v.clientX, l = v.clientY, N("start", v));
    }
  }
  function p(v) {
    if (xr(v), !u) {
      var b = v.clientX - a, N = v.clientY - l;
      u = b * b + N * N > f;
    }
    o.mouse("drag", v);
  }
  function x(v) {
    Kt(v.view).on("mousemove.drag mouseup.drag", null), Lu(v.view, u), xr(v), o.mouse("end", v);
  }
  function C(v, b) {
    if (e.call(this, v, b)) {
      var N = v.changedTouches, E = t.call(this, v, b), M = N.length, D, V;
      for (D = 0; D < M; ++D)
        (V = _(this, E, v, b, N[D].identifier, N[D])) && (ts(v), V("start", v, N[D]));
    }
  }
  function $(v) {
    var b = v.changedTouches, N = b.length, E, M;
    for (E = 0; E < N; ++E)
      (M = o[b[E].identifier]) && (xr(v), M("drag", v, b[E]));
  }
  function m(v) {
    var b = v.changedTouches, N = b.length, E, M;
    for (c && clearTimeout(c), c = setTimeout(function() {
      c = null;
    }, 500), E = 0; E < N; ++E)
      (M = o[b[E].identifier]) && (ts(v), M("end", v, b[E]));
  }
  function _(v, b, N, E, M, D) {
    var V = i.copy(), A = Qt(D || N, b), O, R, S;
    if ((S = n.call(v, new bs("beforestart", {
      sourceEvent: N,
      target: d,
      identifier: M,
      active: s,
      x: A[0],
      y: A[1],
      dx: 0,
      dy: 0,
      dispatch: V
    }), E)) != null)
      return O = S.x - A[0] || 0, R = S.y - A[1] || 0, function T(k, P, H) {
        var I = A, B;
        switch (k) {
          case "start":
            o[M] = T, B = s++;
            break;
          case "end":
            delete o[M], --s;
          // falls through
          case "drag":
            A = Qt(H || P, b), B = s;
            break;
        }
        V.call(
          k,
          v,
          new bs(k, {
            sourceEvent: P,
            subject: S,
            target: d,
            identifier: M,
            active: B,
            x: A[0] + O,
            y: A[1] + R,
            dx: A[0] - I[0],
            dy: A[1] - I[1],
            dispatch: V
          }),
          E
        );
      };
  }
  return d.filter = function(v) {
    return arguments.length ? (e = typeof v == "function" ? v : Yo(!!v), d) : e;
  }, d.container = function(v) {
    return arguments.length ? (t = typeof v == "function" ? v : Yo(v), d) : t;
  }, d.subject = function(v) {
    return arguments.length ? (n = typeof v == "function" ? v : Yo(v), d) : n;
  }, d.touchable = function(v) {
    return arguments.length ? (r = typeof v == "function" ? v : Yo(!!v), d) : r;
  }, d.on = function() {
    var v = i.on.apply(i, arguments);
    return v === i ? d : v;
  }, d.clickDistance = function(v) {
    return arguments.length ? (f = (v = +v) * v, d) : Math.sqrt(f);
  }, d;
}
function ra(e, t, n) {
  e.prototype = t.prototype = n, n.constructor = e;
}
function Ou(e, t) {
  var n = Object.create(e.prototype);
  for (var r in t) n[r] = t[r];
  return n;
}
function So() {
}
var go = 0.7, ci = 1 / go, br = "\\s*([+-]?\\d+)\\s*", ho = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*", pn = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*", _h = /^#([0-9a-f]{3,8})$/, xh = new RegExp(`^rgb\\(${br},${br},${br}\\)$`), bh = new RegExp(`^rgb\\(${pn},${pn},${pn}\\)$`), Ch = new RegExp(`^rgba\\(${br},${br},${br},${ho}\\)$`), kh = new RegExp(`^rgba\\(${pn},${pn},${pn},${ho}\\)$`), $h = new RegExp(`^hsl\\(${ho},${pn},${pn}\\)$`), Eh = new RegExp(`^hsla\\(${ho},${pn},${pn},${ho}\\)$`), Fa = {
  aliceblue: 15792383,
  antiquewhite: 16444375,
  aqua: 65535,
  aquamarine: 8388564,
  azure: 15794175,
  beige: 16119260,
  bisque: 16770244,
  black: 0,
  blanchedalmond: 16772045,
  blue: 255,
  blueviolet: 9055202,
  brown: 10824234,
  burlywood: 14596231,
  cadetblue: 6266528,
  chartreuse: 8388352,
  chocolate: 13789470,
  coral: 16744272,
  cornflowerblue: 6591981,
  cornsilk: 16775388,
  crimson: 14423100,
  cyan: 65535,
  darkblue: 139,
  darkcyan: 35723,
  darkgoldenrod: 12092939,
  darkgray: 11119017,
  darkgreen: 25600,
  darkgrey: 11119017,
  darkkhaki: 12433259,
  darkmagenta: 9109643,
  darkolivegreen: 5597999,
  darkorange: 16747520,
  darkorchid: 10040012,
  darkred: 9109504,
  darksalmon: 15308410,
  darkseagreen: 9419919,
  darkslateblue: 4734347,
  darkslategray: 3100495,
  darkslategrey: 3100495,
  darkturquoise: 52945,
  darkviolet: 9699539,
  deeppink: 16716947,
  deepskyblue: 49151,
  dimgray: 6908265,
  dimgrey: 6908265,
  dodgerblue: 2003199,
  firebrick: 11674146,
  floralwhite: 16775920,
  forestgreen: 2263842,
  fuchsia: 16711935,
  gainsboro: 14474460,
  ghostwhite: 16316671,
  gold: 16766720,
  goldenrod: 14329120,
  gray: 8421504,
  green: 32768,
  greenyellow: 11403055,
  grey: 8421504,
  honeydew: 15794160,
  hotpink: 16738740,
  indianred: 13458524,
  indigo: 4915330,
  ivory: 16777200,
  khaki: 15787660,
  lavender: 15132410,
  lavenderblush: 16773365,
  lawngreen: 8190976,
  lemonchiffon: 16775885,
  lightblue: 11393254,
  lightcoral: 15761536,
  lightcyan: 14745599,
  lightgoldenrodyellow: 16448210,
  lightgray: 13882323,
  lightgreen: 9498256,
  lightgrey: 13882323,
  lightpink: 16758465,
  lightsalmon: 16752762,
  lightseagreen: 2142890,
  lightskyblue: 8900346,
  lightslategray: 7833753,
  lightslategrey: 7833753,
  lightsteelblue: 11584734,
  lightyellow: 16777184,
  lime: 65280,
  limegreen: 3329330,
  linen: 16445670,
  magenta: 16711935,
  maroon: 8388608,
  mediumaquamarine: 6737322,
  mediumblue: 205,
  mediumorchid: 12211667,
  mediumpurple: 9662683,
  mediumseagreen: 3978097,
  mediumslateblue: 8087790,
  mediumspringgreen: 64154,
  mediumturquoise: 4772300,
  mediumvioletred: 13047173,
  midnightblue: 1644912,
  mintcream: 16121850,
  mistyrose: 16770273,
  moccasin: 16770229,
  navajowhite: 16768685,
  navy: 128,
  oldlace: 16643558,
  olive: 8421376,
  olivedrab: 7048739,
  orange: 16753920,
  orangered: 16729344,
  orchid: 14315734,
  palegoldenrod: 15657130,
  palegreen: 10025880,
  paleturquoise: 11529966,
  palevioletred: 14381203,
  papayawhip: 16773077,
  peachpuff: 16767673,
  peru: 13468991,
  pink: 16761035,
  plum: 14524637,
  powderblue: 11591910,
  purple: 8388736,
  rebeccapurple: 6697881,
  red: 16711680,
  rosybrown: 12357519,
  royalblue: 4286945,
  saddlebrown: 9127187,
  salmon: 16416882,
  sandybrown: 16032864,
  seagreen: 3050327,
  seashell: 16774638,
  sienna: 10506797,
  silver: 12632256,
  skyblue: 8900331,
  slateblue: 6970061,
  slategray: 7372944,
  slategrey: 7372944,
  snow: 16775930,
  springgreen: 65407,
  steelblue: 4620980,
  tan: 13808780,
  teal: 32896,
  thistle: 14204888,
  tomato: 16737095,
  turquoise: 4251856,
  violet: 15631086,
  wheat: 16113331,
  white: 16777215,
  whitesmoke: 16119285,
  yellow: 16776960,
  yellowgreen: 10145074
};
ra(So, vo, {
  copy(e) {
    return Object.assign(new this.constructor(), this, e);
  },
  displayable() {
    return this.rgb().displayable();
  },
  hex: Wa,
  // Deprecated! Use color.formatHex.
  formatHex: Wa,
  formatHex8: Sh,
  formatHsl: Ph,
  formatRgb: Ka,
  toString: Ka
});
function Wa() {
  return this.rgb().formatHex();
}
function Sh() {
  return this.rgb().formatHex8();
}
function Ph() {
  return Iu(this).formatHsl();
}
function Ka() {
  return this.rgb().formatRgb();
}
function vo(e) {
  var t, n;
  return e = (e + "").trim().toLowerCase(), (t = _h.exec(e)) ? (n = t[1].length, t = parseInt(t[1], 16), n === 6 ? qa(t) : n === 3 ? new Ht(t >> 8 & 15 | t >> 4 & 240, t >> 4 & 15 | t & 240, (t & 15) << 4 | t & 15, 1) : n === 8 ? Zo(t >> 24 & 255, t >> 16 & 255, t >> 8 & 255, (t & 255) / 255) : n === 4 ? Zo(t >> 12 & 15 | t >> 8 & 240, t >> 8 & 15 | t >> 4 & 240, t >> 4 & 15 | t & 240, ((t & 15) << 4 | t & 15) / 255) : null) : (t = xh.exec(e)) ? new Ht(t[1], t[2], t[3], 1) : (t = bh.exec(e)) ? new Ht(t[1] * 255 / 100, t[2] * 255 / 100, t[3] * 255 / 100, 1) : (t = Ch.exec(e)) ? Zo(t[1], t[2], t[3], t[4]) : (t = kh.exec(e)) ? Zo(t[1] * 255 / 100, t[2] * 255 / 100, t[3] * 255 / 100, t[4]) : (t = $h.exec(e)) ? ja(t[1], t[2] / 100, t[3] / 100, 1) : (t = Eh.exec(e)) ? ja(t[1], t[2] / 100, t[3] / 100, t[4]) : Fa.hasOwnProperty(e) ? qa(Fa[e]) : e === "transparent" ? new Ht(NaN, NaN, NaN, 0) : null;
}
function qa(e) {
  return new Ht(e >> 16 & 255, e >> 8 & 255, e & 255, 1);
}
function Zo(e, t, n, r) {
  return r <= 0 && (e = t = n = NaN), new Ht(e, t, n, r);
}
function Nh(e) {
  return e instanceof So || (e = vo(e)), e ? (e = e.rgb(), new Ht(e.r, e.g, e.b, e.opacity)) : new Ht();
}
function Cs(e, t, n, r) {
  return arguments.length === 1 ? Nh(e) : new Ht(e, t, n, r ?? 1);
}
function Ht(e, t, n, r) {
  this.r = +e, this.g = +t, this.b = +n, this.opacity = +r;
}
ra(Ht, Cs, Ou(So, {
  brighter(e) {
    return e = e == null ? ci : Math.pow(ci, e), new Ht(this.r * e, this.g * e, this.b * e, this.opacity);
  },
  darker(e) {
    return e = e == null ? go : Math.pow(go, e), new Ht(this.r * e, this.g * e, this.b * e, this.opacity);
  },
  rgb() {
    return this;
  },
  clamp() {
    return new Ht(sr(this.r), sr(this.g), sr(this.b), di(this.opacity));
  },
  displayable() {
    return -0.5 <= this.r && this.r < 255.5 && -0.5 <= this.g && this.g < 255.5 && -0.5 <= this.b && this.b < 255.5 && 0 <= this.opacity && this.opacity <= 1;
  },
  hex: Ga,
  // Deprecated! Use color.formatHex.
  formatHex: Ga,
  formatHex8: Mh,
  formatRgb: Ua,
  toString: Ua
}));
function Ga() {
  return `#${or(this.r)}${or(this.g)}${or(this.b)}`;
}
function Mh() {
  return `#${or(this.r)}${or(this.g)}${or(this.b)}${or((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function Ua() {
  const e = di(this.opacity);
  return `${e === 1 ? "rgb(" : "rgba("}${sr(this.r)}, ${sr(this.g)}, ${sr(this.b)}${e === 1 ? ")" : `, ${e})`}`;
}
function di(e) {
  return isNaN(e) ? 1 : Math.max(0, Math.min(1, e));
}
function sr(e) {
  return Math.max(0, Math.min(255, Math.round(e) || 0));
}
function or(e) {
  return e = sr(e), (e < 16 ? "0" : "") + e.toString(16);
}
function ja(e, t, n, r) {
  return r <= 0 ? e = t = n = NaN : n <= 0 || n >= 1 ? e = t = NaN : t <= 0 && (e = NaN), new tn(e, t, n, r);
}
function Iu(e) {
  if (e instanceof tn) return new tn(e.h, e.s, e.l, e.opacity);
  if (e instanceof So || (e = vo(e)), !e) return new tn();
  if (e instanceof tn) return e;
  e = e.rgb();
  var t = e.r / 255, n = e.g / 255, r = e.b / 255, o = Math.min(t, n, r), i = Math.max(t, n, r), s = NaN, a = i - o, l = (i + o) / 2;
  return a ? (t === i ? s = (n - r) / a + (n < r) * 6 : n === i ? s = (r - t) / a + 2 : s = (t - n) / a + 4, a /= l < 0.5 ? i + o : 2 - i - o, s *= 60) : a = l > 0 && l < 1 ? 0 : s, new tn(s, a, l, e.opacity);
}
function Th(e, t, n, r) {
  return arguments.length === 1 ? Iu(e) : new tn(e, t, n, r ?? 1);
}
function tn(e, t, n, r) {
  this.h = +e, this.s = +t, this.l = +n, this.opacity = +r;
}
ra(tn, Th, Ou(So, {
  brighter(e) {
    return e = e == null ? ci : Math.pow(ci, e), new tn(this.h, this.s, this.l * e, this.opacity);
  },
  darker(e) {
    return e = e == null ? go : Math.pow(go, e), new tn(this.h, this.s, this.l * e, this.opacity);
  },
  rgb() {
    var e = this.h % 360 + (this.h < 0) * 360, t = isNaN(e) || isNaN(this.s) ? 0 : this.s, n = this.l, r = n + (n < 0.5 ? n : 1 - n) * t, o = 2 * n - r;
    return new Ht(
      ns(e >= 240 ? e - 240 : e + 120, o, r),
      ns(e, o, r),
      ns(e < 120 ? e + 240 : e - 120, o, r),
      this.opacity
    );
  },
  clamp() {
    return new tn(Ja(this.h), Xo(this.s), Xo(this.l), di(this.opacity));
  },
  displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && 0 <= this.l && this.l <= 1 && 0 <= this.opacity && this.opacity <= 1;
  },
  formatHsl() {
    const e = di(this.opacity);
    return `${e === 1 ? "hsl(" : "hsla("}${Ja(this.h)}, ${Xo(this.s) * 100}%, ${Xo(this.l) * 100}%${e === 1 ? ")" : `, ${e})`}`;
  }
}));
function Ja(e) {
  return e = (e || 0) % 360, e < 0 ? e + 360 : e;
}
function Xo(e) {
  return Math.max(0, Math.min(1, e || 0));
}
function ns(e, t, n) {
  return (e < 60 ? t + (n - t) * e / 60 : e < 180 ? n : e < 240 ? t + (n - t) * (240 - e) / 60 : t) * 255;
}
const zu = (e) => () => e;
function Hh(e, t) {
  return function(n) {
    return e + n * t;
  };
}
function Vh(e, t, n) {
  return e = Math.pow(e, n), t = Math.pow(t, n) - e, n = 1 / n, function(r) {
    return Math.pow(e + r * t, n);
  };
}
function Dh(e) {
  return (e = +e) == 1 ? Ru : function(t, n) {
    return n - t ? Vh(t, n, e) : zu(isNaN(t) ? n : t);
  };
}
function Ru(e, t) {
  var n = t - e;
  return n ? Hh(e, n) : zu(isNaN(e) ? t : e);
}
const Qa = function e(t) {
  var n = Dh(t);
  function r(o, i) {
    var s = n((o = Cs(o)).r, (i = Cs(i)).r), a = n(o.g, i.g), l = n(o.b, i.b), u = Ru(o.opacity, i.opacity);
    return function(c) {
      return o.r = s(c), o.g = a(c), o.b = l(c), o.opacity = u(c), o + "";
    };
  }
  return r.gamma = e, r;
}(1);
function Yn(e, t) {
  return e = +e, t = +t, function(n) {
    return e * (1 - n) + t * n;
  };
}
var ks = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g, rs = new RegExp(ks.source, "g");
function Ah(e) {
  return function() {
    return e;
  };
}
function Lh(e) {
  return function(t) {
    return e(t) + "";
  };
}
function Oh(e, t) {
  var n = ks.lastIndex = rs.lastIndex = 0, r, o, i, s = -1, a = [], l = [];
  for (e = e + "", t = t + ""; (r = ks.exec(e)) && (o = rs.exec(t)); )
    (i = o.index) > n && (i = t.slice(n, i), a[s] ? a[s] += i : a[++s] = i), (r = r[0]) === (o = o[0]) ? a[s] ? a[s] += o : a[++s] = o : (a[++s] = null, l.push({ i: s, x: Yn(r, o) })), n = rs.lastIndex;
  return n < t.length && (i = t.slice(n), a[s] ? a[s] += i : a[++s] = i), a.length < 2 ? l[0] ? Lh(l[0].x) : Ah(t) : (t = l.length, function(u) {
    for (var c = 0, f; c < t; ++c) a[(f = l[c]).i] = f.x(u);
    return a.join("");
  });
}
var el = 180 / Math.PI, $s = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1
};
function Bu(e, t, n, r, o, i) {
  var s, a, l;
  return (s = Math.sqrt(e * e + t * t)) && (e /= s, t /= s), (l = e * n + t * r) && (n -= e * l, r -= t * l), (a = Math.sqrt(n * n + r * r)) && (n /= a, r /= a, l /= a), e * r < t * n && (e = -e, t = -t, l = -l, s = -s), {
    translateX: o,
    translateY: i,
    rotate: Math.atan2(t, e) * el,
    skewX: Math.atan(l) * el,
    scaleX: s,
    scaleY: a
  };
}
var Fo;
function Ih(e) {
  const t = new (typeof DOMMatrix == "function" ? DOMMatrix : WebKitCSSMatrix)(e + "");
  return t.isIdentity ? $s : Bu(t.a, t.b, t.c, t.d, t.e, t.f);
}
function zh(e) {
  return e == null || (Fo || (Fo = document.createElementNS("http://www.w3.org/2000/svg", "g")), Fo.setAttribute("transform", e), !(e = Fo.transform.baseVal.consolidate())) ? $s : (e = e.matrix, Bu(e.a, e.b, e.c, e.d, e.e, e.f));
}
function Yu(e, t, n, r) {
  function o(u) {
    return u.length ? u.pop() + " " : "";
  }
  function i(u, c, f, d, g, p) {
    if (u !== f || c !== d) {
      var x = g.push("translate(", null, t, null, n);
      p.push({ i: x - 4, x: Yn(u, f) }, { i: x - 2, x: Yn(c, d) });
    } else (f || d) && g.push("translate(" + f + t + d + n);
  }
  function s(u, c, f, d) {
    u !== c ? (u - c > 180 ? c += 360 : c - u > 180 && (u += 360), d.push({ i: f.push(o(f) + "rotate(", null, r) - 2, x: Yn(u, c) })) : c && f.push(o(f) + "rotate(" + c + r);
  }
  function a(u, c, f, d) {
    u !== c ? d.push({ i: f.push(o(f) + "skewX(", null, r) - 2, x: Yn(u, c) }) : c && f.push(o(f) + "skewX(" + c + r);
  }
  function l(u, c, f, d, g, p) {
    if (u !== f || c !== d) {
      var x = g.push(o(g) + "scale(", null, ",", null, ")");
      p.push({ i: x - 4, x: Yn(u, f) }, { i: x - 2, x: Yn(c, d) });
    } else (f !== 1 || d !== 1) && g.push(o(g) + "scale(" + f + "," + d + ")");
  }
  return function(u, c) {
    var f = [], d = [];
    return u = e(u), c = e(c), i(u.translateX, u.translateY, c.translateX, c.translateY, f, d), s(u.rotate, c.rotate, f, d), a(u.skewX, c.skewX, f, d), l(u.scaleX, u.scaleY, c.scaleX, c.scaleY, f, d), u = c = null, function(g) {
      for (var p = -1, x = d.length, C; ++p < x; ) f[(C = d[p]).i] = C.x(g);
      return f.join("");
    };
  };
}
var Rh = Yu(Ih, "px, ", "px)", "deg)"), Bh = Yu(zh, ", ", ")", ")"), Yh = 1e-12;
function tl(e) {
  return ((e = Math.exp(e)) + 1 / e) / 2;
}
function Zh(e) {
  return ((e = Math.exp(e)) - 1 / e) / 2;
}
function Xh(e) {
  return ((e = Math.exp(2 * e)) - 1) / (e + 1);
}
const Fh = function e(t, n, r) {
  function o(i, s) {
    var a = i[0], l = i[1], u = i[2], c = s[0], f = s[1], d = s[2], g = c - a, p = f - l, x = g * g + p * p, C, $;
    if (x < Yh)
      $ = Math.log(d / u) / t, C = function(E) {
        return [
          a + E * g,
          l + E * p,
          u * Math.exp(t * E * $)
        ];
      };
    else {
      var m = Math.sqrt(x), _ = (d * d - u * u + r * x) / (2 * u * n * m), v = (d * d - u * u - r * x) / (2 * d * n * m), b = Math.log(Math.sqrt(_ * _ + 1) - _), N = Math.log(Math.sqrt(v * v + 1) - v);
      $ = (N - b) / t, C = function(E) {
        var M = E * $, D = tl(b), V = u / (n * m) * (D * Xh(t * M + b) - Zh(b));
        return [
          a + V * g,
          l + V * p,
          u * D / tl(t * M + b)
        ];
      };
    }
    return C.duration = $ * 1e3 * t / Math.SQRT2, C;
  }
  return o.rho = function(i) {
    var s = Math.max(1e-3, +i), a = s * s, l = a * a;
    return e(s, a, l);
  }, o;
}(Math.SQRT2, 2, 4);
var Vr = 0, to = 0, Jr = 0, Zu = 1e3, fi, no, gi = 0, ur = 0, Ri = 0, po = typeof performance == "object" && performance.now ? performance : Date, Xu = typeof window == "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(e) {
  setTimeout(e, 17);
};
function oa() {
  return ur || (Xu(Wh), ur = po.now() + Ri);
}
function Wh() {
  ur = 0;
}
function hi() {
  this._call = this._time = this._next = null;
}
hi.prototype = Fu.prototype = {
  constructor: hi,
  restart: function(e, t, n) {
    if (typeof e != "function") throw new TypeError("callback is not a function");
    n = (n == null ? oa() : +n) + (t == null ? 0 : +t), !this._next && no !== this && (no ? no._next = this : fi = this, no = this), this._call = e, this._time = n, Es();
  },
  stop: function() {
    this._call && (this._call = null, this._time = 1 / 0, Es());
  }
};
function Fu(e, t, n) {
  var r = new hi();
  return r.restart(e, t, n), r;
}
function Kh() {
  oa(), ++Vr;
  for (var e = fi, t; e; )
    (t = ur - e._time) >= 0 && e._call.call(void 0, t), e = e._next;
  --Vr;
}
function nl() {
  ur = (gi = po.now()) + Ri, Vr = to = 0;
  try {
    Kh();
  } finally {
    Vr = 0, Gh(), ur = 0;
  }
}
function qh() {
  var e = po.now(), t = e - gi;
  t > Zu && (Ri -= t, gi = e);
}
function Gh() {
  for (var e, t = fi, n, r = 1 / 0; t; )
    t._call ? (r > t._time && (r = t._time), e = t, t = t._next) : (n = t._next, t._next = null, t = e ? e._next = n : fi = n);
  no = e, Es(r);
}
function Es(e) {
  if (!Vr) {
    to && (to = clearTimeout(to));
    var t = e - ur;
    t > 24 ? (e < 1 / 0 && (to = setTimeout(nl, e - po.now() - Ri)), Jr && (Jr = clearInterval(Jr))) : (Jr || (gi = po.now(), Jr = setInterval(qh, Zu)), Vr = 1, Xu(nl));
  }
}
function rl(e, t, n) {
  var r = new hi();
  return t = t == null ? 0 : +t, r.restart((o) => {
    r.stop(), e(o + t);
  }, t, n), r;
}
var Uh = Ii("start", "end", "cancel", "interrupt"), jh = [], Wu = 0, ol = 1, Ss = 2, jo = 3, il = 4, Ps = 5, Jo = 6;
function Bi(e, t, n, r, o, i) {
  var s = e.__transition;
  if (!s) e.__transition = {};
  else if (n in s) return;
  Jh(e, n, {
    name: t,
    index: r,
    // For context during callback.
    group: o,
    // For context during callback.
    on: Uh,
    tween: jh,
    time: i.time,
    delay: i.delay,
    duration: i.duration,
    ease: i.ease,
    timer: null,
    state: Wu
  });
}
function ia(e, t) {
  var n = cn(e, t);
  if (n.state > Wu) throw new Error("too late; already scheduled");
  return n;
}
function Cn(e, t) {
  var n = cn(e, t);
  if (n.state > jo) throw new Error("too late; already running");
  return n;
}
function cn(e, t) {
  var n = e.__transition;
  if (!n || !(n = n[t])) throw new Error("transition not found");
  return n;
}
function Jh(e, t, n) {
  var r = e.__transition, o;
  r[t] = n, n.timer = Fu(i, 0, n.time);
  function i(u) {
    n.state = ol, n.timer.restart(s, n.delay, n.time), n.delay <= u && s(u - n.delay);
  }
  function s(u) {
    var c, f, d, g;
    if (n.state !== ol) return l();
    for (c in r)
      if (g = r[c], g.name === n.name) {
        if (g.state === jo) return rl(s);
        g.state === il ? (g.state = Jo, g.timer.stop(), g.on.call("interrupt", e, e.__data__, g.index, g.group), delete r[c]) : +c < t && (g.state = Jo, g.timer.stop(), g.on.call("cancel", e, e.__data__, g.index, g.group), delete r[c]);
      }
    if (rl(function() {
      n.state === jo && (n.state = il, n.timer.restart(a, n.delay, n.time), a(u));
    }), n.state = Ss, n.on.call("start", e, e.__data__, n.index, n.group), n.state === Ss) {
      for (n.state = jo, o = new Array(d = n.tween.length), c = 0, f = -1; c < d; ++c)
        (g = n.tween[c].value.call(e, e.__data__, n.index, n.group)) && (o[++f] = g);
      o.length = f + 1;
    }
  }
  function a(u) {
    for (var c = u < n.duration ? n.ease.call(null, u / n.duration) : (n.timer.restart(l), n.state = Ps, 1), f = -1, d = o.length; ++f < d; )
      o[f].call(e, c);
    n.state === Ps && (n.on.call("end", e, e.__data__, n.index, n.group), l());
  }
  function l() {
    n.state = Jo, n.timer.stop(), delete r[t];
    for (var u in r) return;
    delete e.__transition;
  }
}
function Qo(e, t) {
  var n = e.__transition, r, o, i = !0, s;
  if (n) {
    t = t == null ? null : t + "";
    for (s in n) {
      if ((r = n[s]).name !== t) {
        i = !1;
        continue;
      }
      o = r.state > Ss && r.state < Ps, r.state = Jo, r.timer.stop(), r.on.call(o ? "interrupt" : "cancel", e, e.__data__, r.index, r.group), delete n[s];
    }
    i && delete e.__transition;
  }
}
function Qh(e) {
  return this.each(function() {
    Qo(this, e);
  });
}
function ev(e, t) {
  var n, r;
  return function() {
    var o = Cn(this, e), i = o.tween;
    if (i !== n) {
      r = n = i;
      for (var s = 0, a = r.length; s < a; ++s)
        if (r[s].name === t) {
          r = r.slice(), r.splice(s, 1);
          break;
        }
    }
    o.tween = r;
  };
}
function tv(e, t, n) {
  var r, o;
  if (typeof n != "function") throw new Error();
  return function() {
    var i = Cn(this, e), s = i.tween;
    if (s !== r) {
      o = (r = s).slice();
      for (var a = { name: t, value: n }, l = 0, u = o.length; l < u; ++l)
        if (o[l].name === t) {
          o[l] = a;
          break;
        }
      l === u && o.push(a);
    }
    i.tween = o;
  };
}
function nv(e, t) {
  var n = this._id;
  if (e += "", arguments.length < 2) {
    for (var r = cn(this.node(), n).tween, o = 0, i = r.length, s; o < i; ++o)
      if ((s = r[o]).name === e)
        return s.value;
    return null;
  }
  return this.each((t == null ? ev : tv)(n, e, t));
}
function sa(e, t, n) {
  var r = e._id;
  return e.each(function() {
    var o = Cn(this, r);
    (o.value || (o.value = {}))[t] = n.apply(this, arguments);
  }), function(o) {
    return cn(o, r).value[t];
  };
}
function Ku(e, t) {
  var n;
  return (typeof t == "number" ? Yn : t instanceof vo ? Qa : (n = vo(t)) ? (t = n, Qa) : Oh)(e, t);
}
function rv(e) {
  return function() {
    this.removeAttribute(e);
  };
}
function ov(e) {
  return function() {
    this.removeAttributeNS(e.space, e.local);
  };
}
function iv(e, t, n) {
  var r, o = n + "", i;
  return function() {
    var s = this.getAttribute(e);
    return s === o ? null : s === r ? i : i = t(r = s, n);
  };
}
function sv(e, t, n) {
  var r, o = n + "", i;
  return function() {
    var s = this.getAttributeNS(e.space, e.local);
    return s === o ? null : s === r ? i : i = t(r = s, n);
  };
}
function av(e, t, n) {
  var r, o, i;
  return function() {
    var s, a = n(this), l;
    return a == null ? void this.removeAttribute(e) : (s = this.getAttribute(e), l = a + "", s === l ? null : s === r && l === o ? i : (o = l, i = t(r = s, a)));
  };
}
function lv(e, t, n) {
  var r, o, i;
  return function() {
    var s, a = n(this), l;
    return a == null ? void this.removeAttributeNS(e.space, e.local) : (s = this.getAttributeNS(e.space, e.local), l = a + "", s === l ? null : s === r && l === o ? i : (o = l, i = t(r = s, a)));
  };
}
function uv(e, t) {
  var n = zi(e), r = n === "transform" ? Bh : Ku;
  return this.attrTween(e, typeof t == "function" ? (n.local ? lv : av)(n, r, sa(this, "attr." + e, t)) : t == null ? (n.local ? ov : rv)(n) : (n.local ? sv : iv)(n, r, t));
}
function cv(e, t) {
  return function(n) {
    this.setAttribute(e, t.call(this, n));
  };
}
function dv(e, t) {
  return function(n) {
    this.setAttributeNS(e.space, e.local, t.call(this, n));
  };
}
function fv(e, t) {
  var n, r;
  function o() {
    var i = t.apply(this, arguments);
    return i !== r && (n = (r = i) && dv(e, i)), n;
  }
  return o._value = t, o;
}
function gv(e, t) {
  var n, r;
  function o() {
    var i = t.apply(this, arguments);
    return i !== r && (n = (r = i) && cv(e, i)), n;
  }
  return o._value = t, o;
}
function hv(e, t) {
  var n = "attr." + e;
  if (arguments.length < 2) return (n = this.tween(n)) && n._value;
  if (t == null) return this.tween(n, null);
  if (typeof t != "function") throw new Error();
  var r = zi(e);
  return this.tween(n, (r.local ? fv : gv)(r, t));
}
function vv(e, t) {
  return function() {
    ia(this, e).delay = +t.apply(this, arguments);
  };
}
function pv(e, t) {
  return t = +t, function() {
    ia(this, e).delay = t;
  };
}
function mv(e) {
  var t = this._id;
  return arguments.length ? this.each((typeof e == "function" ? vv : pv)(t, e)) : cn(this.node(), t).delay;
}
function yv(e, t) {
  return function() {
    Cn(this, e).duration = +t.apply(this, arguments);
  };
}
function wv(e, t) {
  return t = +t, function() {
    Cn(this, e).duration = t;
  };
}
function _v(e) {
  var t = this._id;
  return arguments.length ? this.each((typeof e == "function" ? yv : wv)(t, e)) : cn(this.node(), t).duration;
}
function xv(e, t) {
  if (typeof t != "function") throw new Error();
  return function() {
    Cn(this, e).ease = t;
  };
}
function bv(e) {
  var t = this._id;
  return arguments.length ? this.each(xv(t, e)) : cn(this.node(), t).ease;
}
function Cv(e, t) {
  return function() {
    var n = t.apply(this, arguments);
    if (typeof n != "function") throw new Error();
    Cn(this, e).ease = n;
  };
}
function kv(e) {
  if (typeof e != "function") throw new Error();
  return this.each(Cv(this._id, e));
}
function $v(e) {
  typeof e != "function" && (e = $u(e));
  for (var t = this._groups, n = t.length, r = new Array(n), o = 0; o < n; ++o)
    for (var i = t[o], s = i.length, a = r[o] = [], l, u = 0; u < s; ++u)
      (l = i[u]) && e.call(l, l.__data__, u, i) && a.push(l);
  return new Ln(r, this._parents, this._name, this._id);
}
function Ev(e) {
  if (e._id !== this._id) throw new Error();
  for (var t = this._groups, n = e._groups, r = t.length, o = n.length, i = Math.min(r, o), s = new Array(r), a = 0; a < i; ++a)
    for (var l = t[a], u = n[a], c = l.length, f = s[a] = new Array(c), d, g = 0; g < c; ++g)
      (d = l[g] || u[g]) && (f[g] = d);
  for (; a < r; ++a)
    s[a] = t[a];
  return new Ln(s, this._parents, this._name, this._id);
}
function Sv(e) {
  return (e + "").trim().split(/^|\s+/).every(function(t) {
    var n = t.indexOf(".");
    return n >= 0 && (t = t.slice(0, n)), !t || t === "start";
  });
}
function Pv(e, t, n) {
  var r, o, i = Sv(t) ? ia : Cn;
  return function() {
    var s = i(this, e), a = s.on;
    a !== r && (o = (r = a).copy()).on(t, n), s.on = o;
  };
}
function Nv(e, t) {
  var n = this._id;
  return arguments.length < 2 ? cn(this.node(), n).on.on(e) : this.each(Pv(n, e, t));
}
function Mv(e) {
  return function() {
    var t = this.parentNode;
    for (var n in this.__transition) if (+n !== e) return;
    t && t.removeChild(this);
  };
}
function Tv() {
  return this.on("end.remove", Mv(this._id));
}
function Hv(e) {
  var t = this._name, n = this._id;
  typeof e != "function" && (e = ta(e));
  for (var r = this._groups, o = r.length, i = new Array(o), s = 0; s < o; ++s)
    for (var a = r[s], l = a.length, u = i[s] = new Array(l), c, f, d = 0; d < l; ++d)
      (c = a[d]) && (f = e.call(c, c.__data__, d, a)) && ("__data__" in c && (f.__data__ = c.__data__), u[d] = f, Bi(u[d], t, n, d, u, cn(c, n)));
  return new Ln(i, this._parents, t, n);
}
function Vv(e) {
  var t = this._name, n = this._id;
  typeof e != "function" && (e = ku(e));
  for (var r = this._groups, o = r.length, i = [], s = [], a = 0; a < o; ++a)
    for (var l = r[a], u = l.length, c, f = 0; f < u; ++f)
      if (c = l[f]) {
        for (var d = e.call(c, c.__data__, f, l), g, p = cn(c, n), x = 0, C = d.length; x < C; ++x)
          (g = d[x]) && Bi(g, t, n, x, d, p);
        i.push(d), s.push(c);
      }
  return new Ln(i, s, t, n);
}
var Dv = Eo.prototype.constructor;
function Av() {
  return new Dv(this._groups, this._parents);
}
function Lv(e, t) {
  var n, r, o;
  return function() {
    var i = Hr(this, e), s = (this.style.removeProperty(e), Hr(this, e));
    return i === s ? null : i === n && s === r ? o : o = t(n = i, r = s);
  };
}
function qu(e) {
  return function() {
    this.style.removeProperty(e);
  };
}
function Ov(e, t, n) {
  var r, o = n + "", i;
  return function() {
    var s = Hr(this, e);
    return s === o ? null : s === r ? i : i = t(r = s, n);
  };
}
function Iv(e, t, n) {
  var r, o, i;
  return function() {
    var s = Hr(this, e), a = n(this), l = a + "";
    return a == null && (l = a = (this.style.removeProperty(e), Hr(this, e))), s === l ? null : s === r && l === o ? i : (o = l, i = t(r = s, a));
  };
}
function zv(e, t) {
  var n, r, o, i = "style." + t, s = "end." + i, a;
  return function() {
    var l = Cn(this, e), u = l.on, c = l.value[i] == null ? a || (a = qu(t)) : void 0;
    (u !== n || o !== c) && (r = (n = u).copy()).on(s, o = c), l.on = r;
  };
}
function Rv(e, t, n) {
  var r = (e += "") == "transform" ? Rh : Ku;
  return t == null ? this.styleTween(e, Lv(e, r)).on("end.style." + e, qu(e)) : typeof t == "function" ? this.styleTween(e, Iv(e, r, sa(this, "style." + e, t))).each(zv(this._id, e)) : this.styleTween(e, Ov(e, r, t), n).on("end.style." + e, null);
}
function Bv(e, t, n) {
  return function(r) {
    this.style.setProperty(e, t.call(this, r), n);
  };
}
function Yv(e, t, n) {
  var r, o;
  function i() {
    var s = t.apply(this, arguments);
    return s !== o && (r = (o = s) && Bv(e, s, n)), r;
  }
  return i._value = t, i;
}
function Zv(e, t, n) {
  var r = "style." + (e += "");
  if (arguments.length < 2) return (r = this.tween(r)) && r._value;
  if (t == null) return this.tween(r, null);
  if (typeof t != "function") throw new Error();
  return this.tween(r, Yv(e, t, n ?? ""));
}
function Xv(e) {
  return function() {
    this.textContent = e;
  };
}
function Fv(e) {
  return function() {
    var t = e(this);
    this.textContent = t ?? "";
  };
}
function Wv(e) {
  return this.tween("text", typeof e == "function" ? Fv(sa(this, "text", e)) : Xv(e == null ? "" : e + ""));
}
function Kv(e) {
  return function(t) {
    this.textContent = e.call(this, t);
  };
}
function qv(e) {
  var t, n;
  function r() {
    var o = e.apply(this, arguments);
    return o !== n && (t = (n = o) && Kv(o)), t;
  }
  return r._value = e, r;
}
function Gv(e) {
  var t = "text";
  if (arguments.length < 1) return (t = this.tween(t)) && t._value;
  if (e == null) return this.tween(t, null);
  if (typeof e != "function") throw new Error();
  return this.tween(t, qv(e));
}
function Uv() {
  for (var e = this._name, t = this._id, n = Gu(), r = this._groups, o = r.length, i = 0; i < o; ++i)
    for (var s = r[i], a = s.length, l, u = 0; u < a; ++u)
      if (l = s[u]) {
        var c = cn(l, t);
        Bi(l, e, n, u, s, {
          time: c.time + c.delay + c.duration,
          delay: 0,
          duration: c.duration,
          ease: c.ease
        });
      }
  return new Ln(r, this._parents, e, n);
}
function jv() {
  var e, t, n = this, r = n._id, o = n.size();
  return new Promise(function(i, s) {
    var a = { value: s }, l = { value: function() {
      --o === 0 && i();
    } };
    n.each(function() {
      var u = Cn(this, r), c = u.on;
      c !== e && (t = (e = c).copy(), t._.cancel.push(a), t._.interrupt.push(a), t._.end.push(l)), u.on = t;
    }), o === 0 && i();
  });
}
var Jv = 0;
function Ln(e, t, n, r) {
  this._groups = e, this._parents = t, this._name = n, this._id = r;
}
function Gu() {
  return ++Jv;
}
var $n = Eo.prototype;
Ln.prototype = {
  constructor: Ln,
  select: Hv,
  selectAll: Vv,
  selectChild: $n.selectChild,
  selectChildren: $n.selectChildren,
  filter: $v,
  merge: Ev,
  selection: Av,
  transition: Uv,
  call: $n.call,
  nodes: $n.nodes,
  node: $n.node,
  size: $n.size,
  empty: $n.empty,
  each: $n.each,
  on: Nv,
  attr: uv,
  attrTween: hv,
  style: Rv,
  styleTween: Zv,
  text: Wv,
  textTween: Gv,
  remove: Tv,
  tween: nv,
  delay: mv,
  duration: _v,
  ease: bv,
  easeVarying: kv,
  end: jv,
  [Symbol.iterator]: $n[Symbol.iterator]
};
function Qv(e) {
  return ((e *= 2) <= 1 ? e * e * e : (e -= 2) * e * e + 2) / 2;
}
var e0 = {
  time: null,
  // Set on use.
  delay: 0,
  duration: 250,
  ease: Qv
};
function t0(e, t) {
  for (var n; !(n = e.__transition) || !(n = n[t]); )
    if (!(e = e.parentNode))
      throw new Error(`transition ${t} not found`);
  return n;
}
function n0(e) {
  var t, n;
  e instanceof Ln ? (t = e._id, e = e._name) : (t = Gu(), (n = e0).time = oa(), e = e == null ? null : e + "");
  for (var r = this._groups, o = r.length, i = 0; i < o; ++i)
    for (var s = r[i], a = s.length, l, u = 0; u < a; ++u)
      (l = s[u]) && Bi(l, e, t, u, s, n || t0(l, t));
  return new Ln(r, this._parents, e, t);
}
Eo.prototype.interrupt = Qh;
Eo.prototype.transition = n0;
const Wo = (e) => () => e;
function r0(e, {
  sourceEvent: t,
  target: n,
  transform: r,
  dispatch: o
}) {
  Object.defineProperties(this, {
    type: { value: e, enumerable: !0, configurable: !0 },
    sourceEvent: { value: t, enumerable: !0, configurable: !0 },
    target: { value: n, enumerable: !0, configurable: !0 },
    transform: { value: r, enumerable: !0, configurable: !0 },
    _: { value: o }
  });
}
function Pn(e, t, n) {
  this.k = e, this.x = t, this.y = n;
}
Pn.prototype = {
  constructor: Pn,
  scale: function(e) {
    return e === 1 ? this : new Pn(this.k * e, this.x, this.y);
  },
  translate: function(e, t) {
    return e === 0 & t === 0 ? this : new Pn(this.k, this.x + this.k * e, this.y + this.k * t);
  },
  apply: function(e) {
    return [e[0] * this.k + this.x, e[1] * this.k + this.y];
  },
  applyX: function(e) {
    return e * this.k + this.x;
  },
  applyY: function(e) {
    return e * this.k + this.y;
  },
  invert: function(e) {
    return [(e[0] - this.x) / this.k, (e[1] - this.y) / this.k];
  },
  invertX: function(e) {
    return (e - this.x) / this.k;
  },
  invertY: function(e) {
    return (e - this.y) / this.k;
  },
  rescaleX: function(e) {
    return e.copy().domain(e.range().map(this.invertX, this).map(e.invert, e));
  },
  rescaleY: function(e) {
    return e.copy().domain(e.range().map(this.invertY, this).map(e.invert, e));
  },
  toString: function() {
    return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
  }
};
var Yi = new Pn(1, 0, 0);
Uu.prototype = Pn.prototype;
function Uu(e) {
  for (; !e.__zoom; ) if (!(e = e.parentNode)) return Yi;
  return e.__zoom;
}
function os(e) {
  e.stopImmediatePropagation();
}
function Qr(e) {
  e.preventDefault(), e.stopImmediatePropagation();
}
function o0(e) {
  return (!e.ctrlKey || e.type === "wheel") && !e.button;
}
function i0() {
  var e = this;
  return e instanceof SVGElement ? (e = e.ownerSVGElement || e, e.hasAttribute("viewBox") ? (e = e.viewBox.baseVal, [[e.x, e.y], [e.x + e.width, e.y + e.height]]) : [[0, 0], [e.width.baseVal.value, e.height.baseVal.value]]) : [[0, 0], [e.clientWidth, e.clientHeight]];
}
function sl() {
  return this.__zoom || Yi;
}
function s0(e) {
  return -e.deltaY * (e.deltaMode === 1 ? 0.05 : e.deltaMode ? 1 : 2e-3) * (e.ctrlKey ? 10 : 1);
}
function a0() {
  return navigator.maxTouchPoints || "ontouchstart" in this;
}
function l0(e, t, n) {
  var r = e.invertX(t[0][0]) - n[0][0], o = e.invertX(t[1][0]) - n[1][0], i = e.invertY(t[0][1]) - n[0][1], s = e.invertY(t[1][1]) - n[1][1];
  return e.translate(
    o > r ? (r + o) / 2 : Math.min(0, r) || Math.max(0, o),
    s > i ? (i + s) / 2 : Math.min(0, i) || Math.max(0, s)
  );
}
function ju() {
  var e = o0, t = i0, n = l0, r = s0, o = a0, i = [0, 1 / 0], s = [[-1 / 0, -1 / 0], [1 / 0, 1 / 0]], a = 250, l = Fh, u = Ii("start", "zoom", "end"), c, f, d, g = 500, p = 150, x = 0, C = 10;
  function $(S) {
    S.property("__zoom", sl).on("wheel.zoom", M, { passive: !1 }).on("mousedown.zoom", D).on("dblclick.zoom", V).filter(o).on("touchstart.zoom", A).on("touchmove.zoom", O).on("touchend.zoom touchcancel.zoom", R).style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
  }
  $.transform = function(S, T, k, P) {
    var H = S.selection ? S.selection() : S;
    H.property("__zoom", sl), S !== H ? b(S, T, k, P) : H.interrupt().each(function() {
      N(this, arguments).event(P).start().zoom(null, typeof T == "function" ? T.apply(this, arguments) : T).end();
    });
  }, $.scaleBy = function(S, T, k, P) {
    $.scaleTo(S, function() {
      var H = this.__zoom.k, I = typeof T == "function" ? T.apply(this, arguments) : T;
      return H * I;
    }, k, P);
  }, $.scaleTo = function(S, T, k, P) {
    $.transform(S, function() {
      var H = t.apply(this, arguments), I = this.__zoom, B = k == null ? v(H) : typeof k == "function" ? k.apply(this, arguments) : k, F = I.invert(B), K = typeof T == "function" ? T.apply(this, arguments) : T;
      return n(_(m(I, K), B, F), H, s);
    }, k, P);
  }, $.translateBy = function(S, T, k, P) {
    $.transform(S, function() {
      return n(this.__zoom.translate(
        typeof T == "function" ? T.apply(this, arguments) : T,
        typeof k == "function" ? k.apply(this, arguments) : k
      ), t.apply(this, arguments), s);
    }, null, P);
  }, $.translateTo = function(S, T, k, P, H) {
    $.transform(S, function() {
      var I = t.apply(this, arguments), B = this.__zoom, F = P == null ? v(I) : typeof P == "function" ? P.apply(this, arguments) : P;
      return n(Yi.translate(F[0], F[1]).scale(B.k).translate(
        typeof T == "function" ? -T.apply(this, arguments) : -T,
        typeof k == "function" ? -k.apply(this, arguments) : -k
      ), I, s);
    }, P, H);
  };
  function m(S, T) {
    return T = Math.max(i[0], Math.min(i[1], T)), T === S.k ? S : new Pn(T, S.x, S.y);
  }
  function _(S, T, k) {
    var P = T[0] - k[0] * S.k, H = T[1] - k[1] * S.k;
    return P === S.x && H === S.y ? S : new Pn(S.k, P, H);
  }
  function v(S) {
    return [(+S[0][0] + +S[1][0]) / 2, (+S[0][1] + +S[1][1]) / 2];
  }
  function b(S, T, k, P) {
    S.on("start.zoom", function() {
      N(this, arguments).event(P).start();
    }).on("interrupt.zoom end.zoom", function() {
      N(this, arguments).event(P).end();
    }).tween("zoom", function() {
      var H = this, I = arguments, B = N(H, I).event(P), F = t.apply(H, I), K = k == null ? v(F) : typeof k == "function" ? k.apply(H, I) : k, ie = Math.max(F[1][0] - F[0][0], F[1][1] - F[0][1]), ee = H.__zoom, W = typeof T == "function" ? T.apply(H, I) : T, ue = l(ee.invert(K).concat(ie / ee.k), W.invert(K).concat(ie / W.k));
      return function(me) {
        if (me === 1) me = W;
        else {
          var Ce = ue(me), ge = ie / Ce[2];
          me = new Pn(ge, K[0] - Ce[0] * ge, K[1] - Ce[1] * ge);
        }
        B.zoom(null, me);
      };
    });
  }
  function N(S, T, k) {
    return !k && S.__zooming || new E(S, T);
  }
  function E(S, T) {
    this.that = S, this.args = T, this.active = 0, this.sourceEvent = null, this.extent = t.apply(S, T), this.taps = 0;
  }
  E.prototype = {
    event: function(S) {
      return S && (this.sourceEvent = S), this;
    },
    start: function() {
      return ++this.active === 1 && (this.that.__zooming = this, this.emit("start")), this;
    },
    zoom: function(S, T) {
      return this.mouse && S !== "mouse" && (this.mouse[1] = T.invert(this.mouse[0])), this.touch0 && S !== "touch" && (this.touch0[1] = T.invert(this.touch0[0])), this.touch1 && S !== "touch" && (this.touch1[1] = T.invert(this.touch1[0])), this.that.__zoom = T, this.emit("zoom"), this;
    },
    end: function() {
      return --this.active === 0 && (delete this.that.__zooming, this.emit("end")), this;
    },
    emit: function(S) {
      var T = Kt(this.that).datum();
      u.call(
        S,
        this.that,
        new r0(S, {
          sourceEvent: this.sourceEvent,
          target: $,
          transform: this.that.__zoom,
          dispatch: u
        }),
        T
      );
    }
  };
  function M(S, ...T) {
    if (!e.apply(this, arguments)) return;
    var k = N(this, T).event(S), P = this.__zoom, H = Math.max(i[0], Math.min(i[1], P.k * Math.pow(2, r.apply(this, arguments)))), I = Qt(S);
    if (k.wheel)
      (k.mouse[0][0] !== I[0] || k.mouse[0][1] !== I[1]) && (k.mouse[1] = P.invert(k.mouse[0] = I)), clearTimeout(k.wheel);
    else {
      if (P.k === H) return;
      k.mouse = [I, P.invert(I)], Qo(this), k.start();
    }
    Qr(S), k.wheel = setTimeout(B, p), k.zoom("mouse", n(_(m(P, H), k.mouse[0], k.mouse[1]), k.extent, s));
    function B() {
      k.wheel = null, k.end();
    }
  }
  function D(S, ...T) {
    if (d || !e.apply(this, arguments)) return;
    var k = S.currentTarget, P = N(this, T, !0).event(S), H = Kt(S.view).on("mousemove.zoom", K, !0).on("mouseup.zoom", ie, !0), I = Qt(S, k), B = S.clientX, F = S.clientY;
    Au(S.view), os(S), P.mouse = [I, this.__zoom.invert(I)], Qo(this), P.start();
    function K(ee) {
      if (Qr(ee), !P.moved) {
        var W = ee.clientX - B, ue = ee.clientY - F;
        P.moved = W * W + ue * ue > x;
      }
      P.event(ee).zoom("mouse", n(_(P.that.__zoom, P.mouse[0] = Qt(ee, k), P.mouse[1]), P.extent, s));
    }
    function ie(ee) {
      H.on("mousemove.zoom mouseup.zoom", null), Lu(ee.view, P.moved), Qr(ee), P.event(ee).end();
    }
  }
  function V(S, ...T) {
    if (e.apply(this, arguments)) {
      var k = this.__zoom, P = Qt(S.changedTouches ? S.changedTouches[0] : S, this), H = k.invert(P), I = k.k * (S.shiftKey ? 0.5 : 2), B = n(_(m(k, I), P, H), t.apply(this, T), s);
      Qr(S), a > 0 ? Kt(this).transition().duration(a).call(b, B, P, S) : Kt(this).call($.transform, B, P, S);
    }
  }
  function A(S, ...T) {
    if (e.apply(this, arguments)) {
      var k = S.touches, P = k.length, H = N(this, T, S.changedTouches.length === P).event(S), I, B, F, K;
      for (os(S), B = 0; B < P; ++B)
        F = k[B], K = Qt(F, this), K = [K, this.__zoom.invert(K), F.identifier], H.touch0 ? !H.touch1 && H.touch0[2] !== K[2] && (H.touch1 = K, H.taps = 0) : (H.touch0 = K, I = !0, H.taps = 1 + !!c);
      c && (c = clearTimeout(c)), I && (H.taps < 2 && (f = K[0], c = setTimeout(function() {
        c = null;
      }, g)), Qo(this), H.start());
    }
  }
  function O(S, ...T) {
    if (this.__zooming) {
      var k = N(this, T).event(S), P = S.changedTouches, H = P.length, I, B, F, K;
      for (Qr(S), I = 0; I < H; ++I)
        B = P[I], F = Qt(B, this), k.touch0 && k.touch0[2] === B.identifier ? k.touch0[0] = F : k.touch1 && k.touch1[2] === B.identifier && (k.touch1[0] = F);
      if (B = k.that.__zoom, k.touch1) {
        var ie = k.touch0[0], ee = k.touch0[1], W = k.touch1[0], ue = k.touch1[1], me = (me = W[0] - ie[0]) * me + (me = W[1] - ie[1]) * me, Ce = (Ce = ue[0] - ee[0]) * Ce + (Ce = ue[1] - ee[1]) * Ce;
        B = m(B, Math.sqrt(me / Ce)), F = [(ie[0] + W[0]) / 2, (ie[1] + W[1]) / 2], K = [(ee[0] + ue[0]) / 2, (ee[1] + ue[1]) / 2];
      } else if (k.touch0) F = k.touch0[0], K = k.touch0[1];
      else return;
      k.zoom("touch", n(_(B, F, K), k.extent, s));
    }
  }
  function R(S, ...T) {
    if (this.__zooming) {
      var k = N(this, T).event(S), P = S.changedTouches, H = P.length, I, B;
      for (os(S), d && clearTimeout(d), d = setTimeout(function() {
        d = null;
      }, g), I = 0; I < H; ++I)
        B = P[I], k.touch0 && k.touch0[2] === B.identifier ? delete k.touch0 : k.touch1 && k.touch1[2] === B.identifier && delete k.touch1;
      if (k.touch1 && !k.touch0 && (k.touch0 = k.touch1, delete k.touch1), k.touch0) k.touch0[1] = this.__zoom.invert(k.touch0[0]);
      else if (k.end(), k.taps === 2 && (B = Qt(B, this), Math.hypot(f[0] - B[0], f[1] - B[1]) < C)) {
        var F = Kt(this).on("dblclick.zoom");
        F && F.apply(this, arguments);
      }
    }
  }
  return $.wheelDelta = function(S) {
    return arguments.length ? (r = typeof S == "function" ? S : Wo(+S), $) : r;
  }, $.filter = function(S) {
    return arguments.length ? (e = typeof S == "function" ? S : Wo(!!S), $) : e;
  }, $.touchable = function(S) {
    return arguments.length ? (o = typeof S == "function" ? S : Wo(!!S), $) : o;
  }, $.extent = function(S) {
    return arguments.length ? (t = typeof S == "function" ? S : Wo([[+S[0][0], +S[0][1]], [+S[1][0], +S[1][1]]]), $) : t;
  }, $.scaleExtent = function(S) {
    return arguments.length ? (i[0] = +S[0], i[1] = +S[1], $) : [i[0], i[1]];
  }, $.translateExtent = function(S) {
    return arguments.length ? (s[0][0] = +S[0][0], s[1][0] = +S[1][0], s[0][1] = +S[0][1], s[1][1] = +S[1][1], $) : [[s[0][0], s[0][1]], [s[1][0], s[1][1]]];
  }, $.constrain = function(S) {
    return arguments.length ? (n = S, $) : n;
  }, $.duration = function(S) {
    return arguments.length ? (a = +S, $) : a;
  }, $.interpolate = function(S) {
    return arguments.length ? (l = S, $) : l;
  }, $.on = function() {
    var S = u.on.apply(u, arguments);
    return S === u ? $ : S;
  }, $.clickDistance = function(S) {
    return arguments.length ? (x = (S = +S) * S, $) : Math.sqrt(x);
  }, $.tapDistance = function(S) {
    return arguments.length ? (C = +S, $) : C;
  }, $;
}
const Dr = {
  error001: () => "[React Flow]: Seems like you have not used zustand provider as an ancestor. Help: https://reactflow.dev/error#001",
  error002: () => "It looks like you've created a new nodeTypes or edgeTypes object. If this wasn't on purpose please define the nodeTypes/edgeTypes outside of the component or memoize them.",
  error003: (e) => `Node type "${e}" not found. Using fallback type "default".`,
  error004: () => "The React Flow parent container needs a width and a height to render the graph.",
  error005: () => "Only child nodes can use a parent extent.",
  error006: () => "Can't create edge. An edge needs a source and a target.",
  error007: (e) => `The old edge with id=${e} does not exist.`,
  error009: (e) => `Marker type "${e}" doesn't exist.`,
  error008: (e, { id: t, sourceHandle: n, targetHandle: r }) => `Couldn't create edge for ${e} handle id: "${e === "source" ? n : r}", edge id: ${t}.`,
  error010: () => "Handle: No node id found. Make sure to only use a Handle inside a custom Node.",
  error011: (e) => `Edge type "${e}" not found. Using fallback type "default".`,
  error012: (e) => `Node with id "${e}" does not exist, it may have been removed. This can happen when a node is deleted before the "onNodeClick" handler is called.`,
  error013: (e = "react") => `It seems that you haven't loaded the styles. Please import '@xyflow/${e}/dist/style.css' or base.css to make sure everything is working properly.`,
  error014: () => "useNodeConnections: No node ID found. Call useNodeConnections inside a custom Node or provide a node ID.",
  error015: () => "It seems that you are trying to drag a node that is not initialized. Please use onNodesChange as explained in the docs."
}, vi = [
  [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
  [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY]
];
var cr;
(function(e) {
  e.Strict = "strict", e.Loose = "loose";
})(cr || (cr = {}));
var qn;
(function(e) {
  e.Free = "free", e.Vertical = "vertical", e.Horizontal = "horizontal";
})(qn || (qn = {}));
var pi;
(function(e) {
  e.Partial = "partial", e.Full = "full";
})(pi || (pi = {}));
const Ns = {
  inProgress: !1,
  isValid: null,
  from: null,
  fromHandle: null,
  fromPosition: null,
  fromNode: null,
  to: null,
  toHandle: null,
  toPosition: null,
  toNode: null
};
var Cr;
(function(e) {
  e.Bezier = "default", e.Straight = "straight", e.Step = "step", e.SmoothStep = "smoothstep", e.SimpleBezier = "simplebezier";
})(Cr || (Cr = {}));
var mo;
(function(e) {
  e.Arrow = "arrow", e.ArrowClosed = "arrowclosed";
})(mo || (mo = {}));
var $e;
(function(e) {
  e.Left = "left", e.Top = "top", e.Right = "right", e.Bottom = "bottom";
})($e || ($e = {}));
const al = {
  [$e.Left]: $e.Right,
  [$e.Right]: $e.Left,
  [$e.Top]: $e.Bottom,
  [$e.Bottom]: $e.Top
};
function u0(e, t) {
  if (!e && !t)
    return !0;
  if (!e || !t || e.size !== t.size)
    return !1;
  if (!e.size && !t.size)
    return !0;
  for (const n of e.keys())
    if (!t.has(n))
      return !1;
  return !0;
}
function ll(e, t, n) {
  if (!n)
    return;
  const r = [];
  e.forEach((o, i) => {
    t != null && t.has(i) || r.push(o);
  }), r.length && n(r);
}
function c0(e) {
  return e === null ? null : e ? "valid" : "invalid";
}
const d0 = (e) => "id" in e && "source" in e && "target" in e, f0 = (e) => "id" in e && "position" in e && !("source" in e) && !("target" in e), aa = (e) => "id" in e && "internals" in e && !("source" in e) && !("target" in e), Po = (e, t = [0, 0]) => {
  const { width: n, height: r } = tr(e), o = e.origin ?? t, i = n * o[0], s = r * o[1];
  return {
    x: e.position.x - i,
    y: e.position.y - s
  };
}, g0 = (e, t = { nodeOrigin: [0, 0], nodeLookup: void 0 }) => {
  if (e.length === 0)
    return { x: 0, y: 0, width: 0, height: 0 };
  const n = e.reduce((r, o) => {
    const i = typeof o == "string";
    let s = !t.nodeLookup && !i ? o : void 0;
    t.nodeLookup && (s = i ? t.nodeLookup.get(o) : aa(o) ? o : t.nodeLookup.get(o.id));
    const a = s ? mi(s, t.nodeOrigin) : { x: 0, y: 0, x2: 0, y2: 0 };
    return Zi(r, a);
  }, { x: 1 / 0, y: 1 / 0, x2: -1 / 0, y2: -1 / 0 });
  return Xi(n);
}, No = (e, t = {}) => {
  if (e.size === 0)
    return { x: 0, y: 0, width: 0, height: 0 };
  let n = { x: 1 / 0, y: 1 / 0, x2: -1 / 0, y2: -1 / 0 };
  return e.forEach((r) => {
    if (t.filter === void 0 || t.filter(r)) {
      const o = mi(r);
      n = Zi(n, o);
    }
  }), Xi(n);
}, Ju = (e, t, [n, r, o] = [0, 0, 1], i = !1, s = !1) => {
  const a = {
    ...Mo(t, [n, r, o]),
    width: t.width / o,
    height: t.height / o
  }, l = [];
  for (const u of e.values()) {
    const { measured: c, selectable: f = !0, hidden: d = !1 } = u;
    if (s && !f || d)
      continue;
    const g = c.width ?? u.width ?? u.initialWidth ?? null, p = c.height ?? u.height ?? u.initialHeight ?? null, x = yo(a, Lr(u)), C = (g ?? 0) * (p ?? 0), $ = i && x > 0;
    (!u.internals.handleBounds || $ || x >= C || u.dragging) && l.push(u);
  }
  return l;
}, Ms = (e, t) => {
  const n = /* @__PURE__ */ new Set();
  return e.forEach((r) => {
    n.add(r.id);
  }), t.filter((r) => n.has(r.source) || n.has(r.target));
};
function ul(e, t) {
  const n = /* @__PURE__ */ new Map(), r = t != null && t.nodes ? new Set(t.nodes.map((o) => o.id)) : null;
  return e.forEach((o) => {
    o.measured.width && o.measured.height && ((t == null ? void 0 : t.includeHiddenNodes) || !o.hidden) && (!r || r.has(o.id)) && n.set(o.id, o);
  }), n;
}
async function cl({ nodes: e, width: t, height: n, panZoom: r, minZoom: o, maxZoom: i }, s) {
  if (e.size === 0)
    return Promise.resolve(!1);
  const a = No(e), l = ua(a, t, n, (s == null ? void 0 : s.minZoom) ?? o, (s == null ? void 0 : s.maxZoom) ?? i, (s == null ? void 0 : s.padding) ?? 0.1);
  return await r.setViewport(l, { duration: s == null ? void 0 : s.duration }), Promise.resolve(!0);
}
function h0({ nodeId: e, nextPosition: t, nodeLookup: n, nodeOrigin: r = [0, 0], nodeExtent: o, onError: i }) {
  const s = n.get(e), a = s.parentId ? n.get(s.parentId) : void 0, { x: l, y: u } = a ? a.internals.positionAbsolute : { x: 0, y: 0 }, c = s.origin ?? r;
  let f = o;
  if (s.extent === "parent" && !s.expandParent)
    if (!a)
      i == null || i("005", Dr.error005());
    else {
      const g = a.measured.width, p = a.measured.height;
      g && p && (f = [
        [l, u],
        [l + g, u + p]
      ]);
    }
  else a && Or(s.extent) && (f = [
    [s.extent[0][0] + l, s.extent[0][1] + u],
    [s.extent[1][0] + l, s.extent[1][1] + u]
  ]);
  const d = Or(f) ? dr(t, f, s.measured) : t;
  return (s.measured.width === void 0 || s.measured.height === void 0) && (i == null || i("015", Dr.error015())), {
    position: {
      x: d.x - l + (s.measured.width ?? 0) * c[0],
      y: d.y - u + (s.measured.height ?? 0) * c[1]
    },
    positionAbsolute: d
  };
}
async function Qu({ nodesToRemove: e = [], edgesToRemove: t = [], nodes: n, edges: r, onBeforeDelete: o }) {
  const i = new Set(e.map((d) => d.id)), s = [];
  for (const d of n) {
    if (d.deletable === !1)
      continue;
    const g = i.has(d.id), p = !g && d.parentId && s.find((x) => x.id === d.parentId);
    (g || p) && s.push(d);
  }
  const a = new Set(t.map((d) => d.id)), l = r.filter((d) => d.deletable !== !1), c = Ms(s, l);
  for (const d of l)
    a.has(d.id) && !c.find((p) => p.id === d.id) && c.push(d);
  if (!o)
    return {
      edges: c,
      nodes: s
    };
  const f = await o({
    nodes: s,
    edges: c
  });
  return typeof f == "boolean" ? f ? { edges: c, nodes: s } : { edges: [], nodes: [] } : f;
}
const Ar = (e, t = 0, n = 1) => Math.min(Math.max(e, t), n), dr = (e = { x: 0, y: 0 }, t, n) => ({
  x: Ar(e.x, t[0][0], t[1][0] - ((n == null ? void 0 : n.width) ?? 0)),
  y: Ar(e.y, t[0][1], t[1][1] - ((n == null ? void 0 : n.height) ?? 0))
});
function ec(e, t, n) {
  const { width: r, height: o } = tr(n), { x: i, y: s } = n.internals.positionAbsolute;
  return dr(e, [
    [i, s],
    [i + r, s + o]
  ], t);
}
const dl = (e, t, n) => e < t ? Ar(Math.abs(e - t), 1, t) / t : e > n ? -Ar(Math.abs(e - n), 1, t) / t : 0, tc = (e, t, n = 15, r = 40) => {
  const o = dl(e.x, r, t.width - r) * n, i = dl(e.y, r, t.height - r) * n;
  return [o, i];
}, Zi = (e, t) => ({
  x: Math.min(e.x, t.x),
  y: Math.min(e.y, t.y),
  x2: Math.max(e.x2, t.x2),
  y2: Math.max(e.y2, t.y2)
}), Ts = ({ x: e, y: t, width: n, height: r }) => ({
  x: e,
  y: t,
  x2: e + n,
  y2: t + r
}), Xi = ({ x: e, y: t, x2: n, y2: r }) => ({
  x: e,
  y: t,
  width: n - e,
  height: r - t
}), Lr = (e, t = [0, 0]) => {
  var o, i;
  const { x: n, y: r } = aa(e) ? e.internals.positionAbsolute : Po(e, t);
  return {
    x: n,
    y: r,
    width: ((o = e.measured) == null ? void 0 : o.width) ?? e.width ?? e.initialWidth ?? 0,
    height: ((i = e.measured) == null ? void 0 : i.height) ?? e.height ?? e.initialHeight ?? 0
  };
}, mi = (e, t = [0, 0]) => {
  var o, i;
  const { x: n, y: r } = aa(e) ? e.internals.positionAbsolute : Po(e, t);
  return {
    x: n,
    y: r,
    x2: n + (((o = e.measured) == null ? void 0 : o.width) ?? e.width ?? e.initialWidth ?? 0),
    y2: r + (((i = e.measured) == null ? void 0 : i.height) ?? e.height ?? e.initialHeight ?? 0)
  };
}, nc = (e, t) => Xi(Zi(Ts(e), Ts(t))), yo = (e, t) => {
  const n = Math.max(0, Math.min(e.x + e.width, t.x + t.width) - Math.max(e.x, t.x)), r = Math.max(0, Math.min(e.y + e.height, t.y + t.height) - Math.max(e.y, t.y));
  return Math.ceil(n * r);
}, fl = (e) => Nn(e.width) && Nn(e.height) && Nn(e.x) && Nn(e.y), Nn = (e) => !isNaN(e) && isFinite(e), v0 = (e, t) => {
}, la = (e, t = [1, 1]) => ({
  x: t[0] * Math.round(e.x / t[0]),
  y: t[1] * Math.round(e.y / t[1])
}), Mo = ({ x: e, y: t }, [n, r, o], i = !1, s = [1, 1]) => {
  const a = {
    x: (e - n) / o,
    y: (t - r) / o
  };
  return i ? la(a, s) : a;
}, rc = ({ x: e, y: t }, [n, r, o]) => ({
  x: e * o + n,
  y: t * o + r
}), ua = (e, t, n, r, o, i) => {
  const s = t / (e.width * (1 + i)), a = n / (e.height * (1 + i)), l = Math.min(s, a), u = Ar(l, r, o), c = e.x + e.width / 2, f = e.y + e.height / 2, d = t / 2 - c * u, g = n / 2 - f * u;
  return { x: d, y: g, zoom: u };
}, yi = () => {
  var e;
  return typeof navigator < "u" && ((e = navigator == null ? void 0 : navigator.userAgent) == null ? void 0 : e.indexOf("Mac")) >= 0;
};
function Or(e) {
  return e !== void 0 && e !== "parent";
}
function tr(e) {
  var t, n;
  return {
    width: ((t = e.measured) == null ? void 0 : t.width) ?? e.width ?? e.initialWidth ?? 0,
    height: ((n = e.measured) == null ? void 0 : n.height) ?? e.height ?? e.initialHeight ?? 0
  };
}
function oc(e) {
  var t, n;
  return (((t = e.measured) == null ? void 0 : t.width) ?? e.width ?? e.initialWidth) !== void 0 && (((n = e.measured) == null ? void 0 : n.height) ?? e.height ?? e.initialHeight) !== void 0;
}
function p0(e, t = { width: 0, height: 0 }, n, r, o) {
  const i = { ...e }, s = r.get(n);
  if (s) {
    const a = s.origin || o;
    i.x += s.internals.positionAbsolute.x - (t.width ?? 0) * a[0], i.y += s.internals.positionAbsolute.y - (t.height ?? 0) * a[1];
  }
  return i;
}
function is(e, { snapGrid: t = [0, 0], snapToGrid: n = !1, transform: r, containerBounds: o }) {
  const { x: i, y: s } = Hn(e), a = Mo({ x: i - ((o == null ? void 0 : o.left) ?? 0), y: s - ((o == null ? void 0 : o.top) ?? 0) }, r), { x: l, y: u } = n ? la(a, t) : a;
  return {
    xSnapped: l,
    ySnapped: u,
    ...a
  };
}
const ca = (e) => ({
  width: e.offsetWidth,
  height: e.offsetHeight
}), m0 = (e) => {
  var t;
  return ((t = e == null ? void 0 : e.getRootNode) == null ? void 0 : t.call(e)) || (window == null ? void 0 : window.document);
}, y0 = ["INPUT", "SELECT", "TEXTAREA"];
function w0(e) {
  var r, o;
  const t = ((o = (r = e.composedPath) == null ? void 0 : r.call(e)) == null ? void 0 : o[0]) || e.target;
  return (t == null ? void 0 : t.nodeType) !== 1 ? !1 : y0.includes(t.nodeName) || t.hasAttribute("contenteditable") || !!t.closest(".nokey");
}
const ic = (e) => "clientX" in e, Hn = (e, t) => {
  var i, s;
  const n = ic(e), r = n ? e.clientX : (i = e.touches) == null ? void 0 : i[0].clientX, o = n ? e.clientY : (s = e.touches) == null ? void 0 : s[0].clientY;
  return {
    x: r - ((t == null ? void 0 : t.left) ?? 0),
    y: o - ((t == null ? void 0 : t.top) ?? 0)
  };
}, gl = (e, t, n, r, o) => {
  const i = t.querySelectorAll(`.${e}`);
  return !i || !i.length ? null : Array.from(i).map((s) => {
    const a = s.getBoundingClientRect();
    return {
      id: s.getAttribute("data-handleid"),
      type: e,
      nodeId: o,
      position: s.getAttribute("data-handlepos"),
      x: (a.left - n.left) / r,
      y: (a.top - n.top) / r,
      ...ca(s)
    };
  });
};
function _0({ sourceX: e, sourceY: t, targetX: n, targetY: r, sourceControlX: o, sourceControlY: i, targetControlX: s, targetControlY: a }) {
  const l = e * 0.125 + o * 0.375 + s * 0.375 + n * 0.125, u = t * 0.125 + i * 0.375 + a * 0.375 + r * 0.125, c = Math.abs(l - e), f = Math.abs(u - t);
  return [l, u, c, f];
}
function Ko(e, t) {
  return e >= 0 ? 0.5 * e : t * 25 * Math.sqrt(-e);
}
function hl({ pos: e, x1: t, y1: n, x2: r, y2: o, c: i }) {
  switch (e) {
    case $e.Left:
      return [t - Ko(t - r, i), n];
    case $e.Right:
      return [t + Ko(r - t, i), n];
    case $e.Top:
      return [t, n - Ko(n - o, i)];
    case $e.Bottom:
      return [t, n + Ko(o - n, i)];
  }
}
function sc({ sourceX: e, sourceY: t, sourcePosition: n = $e.Bottom, targetX: r, targetY: o, targetPosition: i = $e.Top, curvature: s = 0.25 }) {
  const [a, l] = hl({
    pos: n,
    x1: e,
    y1: t,
    x2: r,
    y2: o,
    c: s
  }), [u, c] = hl({
    pos: i,
    x1: r,
    y1: o,
    x2: e,
    y2: t,
    c: s
  }), [f, d, g, p] = _0({
    sourceX: e,
    sourceY: t,
    targetX: r,
    targetY: o,
    sourceControlX: a,
    sourceControlY: l,
    targetControlX: u,
    targetControlY: c
  });
  return [
    `M${e},${t} C${a},${l} ${u},${c} ${r},${o}`,
    f,
    d,
    g,
    p
  ];
}
function ac({ sourceX: e, sourceY: t, targetX: n, targetY: r }) {
  const o = Math.abs(n - e) / 2, i = n < e ? n + o : n - o, s = Math.abs(r - t) / 2, a = r < t ? r + s : r - s;
  return [i, a, o, s];
}
function x0({ sourceNode: e, targetNode: t, selected: n = !1, zIndex: r = 0, elevateOnSelect: o = !1 }) {
  if (!o)
    return r;
  const i = n || t.selected || e.selected, s = Math.max(e.internals.z || 0, t.internals.z || 0, 1e3);
  return r + (i ? s : 0);
}
function b0({ sourceNode: e, targetNode: t, width: n, height: r, transform: o }) {
  const i = Zi(mi(e), mi(t));
  i.x === i.x2 && (i.x2 += 1), i.y === i.y2 && (i.y2 += 1);
  const s = {
    x: -o[0] / o[2],
    y: -o[1] / o[2],
    width: n / o[2],
    height: r / o[2]
  };
  return yo(s, Xi(i)) > 0;
}
const C0 = ({ source: e, sourceHandle: t, target: n, targetHandle: r }) => `xy-edge__${e}${t || ""}-${n}${r || ""}`, k0 = (e, t) => t.some((n) => n.source === e.source && n.target === e.target && (n.sourceHandle === e.sourceHandle || !n.sourceHandle && !e.sourceHandle) && (n.targetHandle === e.targetHandle || !n.targetHandle && !e.targetHandle)), $0 = (e, t) => {
  if (!e.source || !e.target)
    return t;
  let n;
  return d0(e) ? n = { ...e } : n = {
    ...e,
    id: C0(e)
  }, k0(n, t) ? t : (n.sourceHandle === null && delete n.sourceHandle, n.targetHandle === null && delete n.targetHandle, t.concat(n));
};
function Hs({ sourceX: e, sourceY: t, targetX: n, targetY: r }) {
  const [o, i, s, a] = ac({
    sourceX: e,
    sourceY: t,
    targetX: n,
    targetY: r
  });
  return [`M ${e},${t}L ${n},${r}`, o, i, s, a];
}
const vl = {
  [$e.Left]: { x: -1, y: 0 },
  [$e.Right]: { x: 1, y: 0 },
  [$e.Top]: { x: 0, y: -1 },
  [$e.Bottom]: { x: 0, y: 1 }
}, E0 = ({ source: e, sourcePosition: t = $e.Bottom, target: n }) => t === $e.Left || t === $e.Right ? e.x < n.x ? { x: 1, y: 0 } : { x: -1, y: 0 } : e.y < n.y ? { x: 0, y: 1 } : { x: 0, y: -1 }, pl = (e, t) => Math.sqrt(Math.pow(t.x - e.x, 2) + Math.pow(t.y - e.y, 2));
function S0({ source: e, sourcePosition: t = $e.Bottom, target: n, targetPosition: r = $e.Top, center: o, offset: i }) {
  const s = vl[t], a = vl[r], l = { x: e.x + s.x * i, y: e.y + s.y * i }, u = { x: n.x + a.x * i, y: n.y + a.y * i }, c = E0({
    source: l,
    sourcePosition: t,
    target: u
  }), f = c.x !== 0 ? "x" : "y", d = c[f];
  let g = [], p, x;
  const C = { x: 0, y: 0 }, $ = { x: 0, y: 0 }, [m, _, v, b] = ac({
    sourceX: e.x,
    sourceY: e.y,
    targetX: n.x,
    targetY: n.y
  });
  if (s[f] * a[f] === -1) {
    p = o.x ?? m, x = o.y ?? _;
    const E = [
      { x: p, y: l.y },
      { x: p, y: u.y }
    ], M = [
      { x: l.x, y: x },
      { x: u.x, y: x }
    ];
    s[f] === d ? g = f === "x" ? E : M : g = f === "x" ? M : E;
  } else {
    const E = [{ x: l.x, y: u.y }], M = [{ x: u.x, y: l.y }];
    if (f === "x" ? g = s.x === d ? M : E : g = s.y === d ? E : M, t === r) {
      const R = Math.abs(e[f] - n[f]);
      if (R <= i) {
        const S = Math.min(i - 1, i - R);
        s[f] === d ? C[f] = (l[f] > e[f] ? -1 : 1) * S : $[f] = (u[f] > n[f] ? -1 : 1) * S;
      }
    }
    if (t !== r) {
      const R = f === "x" ? "y" : "x", S = s[f] === a[R], T = l[R] > u[R], k = l[R] < u[R];
      (s[f] === 1 && (!S && T || S && k) || s[f] !== 1 && (!S && k || S && T)) && (g = f === "x" ? E : M);
    }
    const D = { x: l.x + C.x, y: l.y + C.y }, V = { x: u.x + $.x, y: u.y + $.y }, A = Math.max(Math.abs(D.x - g[0].x), Math.abs(V.x - g[0].x)), O = Math.max(Math.abs(D.y - g[0].y), Math.abs(V.y - g[0].y));
    A >= O ? (p = (D.x + V.x) / 2, x = g[0].y) : (p = g[0].x, x = (D.y + V.y) / 2);
  }
  return [[
    e,
    { x: l.x + C.x, y: l.y + C.y },
    ...g,
    { x: u.x + $.x, y: u.y + $.y },
    n
  ], p, x, v, b];
}
function P0(e, t, n, r) {
  const o = Math.min(pl(e, t) / 2, pl(t, n) / 2, r), { x: i, y: s } = t;
  if (e.x === i && i === n.x || e.y === s && s === n.y)
    return `L${i} ${s}`;
  if (e.y === s) {
    const u = e.x < n.x ? -1 : 1, c = e.y < n.y ? 1 : -1;
    return `L ${i + o * u},${s}Q ${i},${s} ${i},${s + o * c}`;
  }
  const a = e.x < n.x ? 1 : -1, l = e.y < n.y ? -1 : 1;
  return `L ${i},${s + o * l}Q ${i},${s} ${i + o * a},${s}`;
}
function wi({ sourceX: e, sourceY: t, sourcePosition: n = $e.Bottom, targetX: r, targetY: o, targetPosition: i = $e.Top, borderRadius: s = 5, centerX: a, centerY: l, offset: u = 20 }) {
  const [c, f, d, g, p] = S0({
    source: { x: e, y: t },
    sourcePosition: n,
    target: { x: r, y: o },
    targetPosition: i,
    center: { x: a, y: l },
    offset: u
  });
  return [c.reduce((C, $, m) => {
    let _ = "";
    return m > 0 && m < c.length - 1 ? _ = P0(c[m - 1], $, c[m + 1], s) : _ = `${m === 0 ? "M" : "L"}${$.x} ${$.y}`, C += _, C;
  }, ""), f, d, g, p];
}
function ml(e) {
  var t;
  return e && !!(e.internals.handleBounds || (t = e.handles) != null && t.length) && !!(e.measured.width || e.width || e.initialWidth);
}
function N0(e) {
  var f;
  const { sourceNode: t, targetNode: n } = e;
  if (!ml(t) || !ml(n))
    return null;
  const r = t.internals.handleBounds || yl(t.handles), o = n.internals.handleBounds || yl(n.handles), i = wl((r == null ? void 0 : r.source) ?? [], e.sourceHandle), s = wl(
    // when connection type is loose we can define all handles as sources and connect source -> source
    e.connectionMode === cr.Strict ? (o == null ? void 0 : o.target) ?? [] : ((o == null ? void 0 : o.target) ?? []).concat((o == null ? void 0 : o.source) ?? []),
    e.targetHandle
  );
  if (!i || !s)
    return (f = e.onError) == null || f.call(e, "008", Dr.error008(i ? "target" : "source", {
      id: e.id,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle
    })), null;
  const a = (i == null ? void 0 : i.position) || $e.Bottom, l = (s == null ? void 0 : s.position) || $e.Top, u = wo(t, i, a), c = wo(n, s, l);
  return {
    sourceX: u.x,
    sourceY: u.y,
    targetX: c.x,
    targetY: c.y,
    sourcePosition: a,
    targetPosition: l
  };
}
function yl(e) {
  if (!e)
    return null;
  const t = [], n = [];
  for (const r of e)
    r.width = r.width ?? 1, r.height = r.height ?? 1, r.type === "source" ? t.push(r) : r.type === "target" && n.push(r);
  return {
    source: t,
    target: n
  };
}
function wo(e, t, n = $e.Left, r = !1) {
  const o = ((t == null ? void 0 : t.x) ?? 0) + e.internals.positionAbsolute.x, i = ((t == null ? void 0 : t.y) ?? 0) + e.internals.positionAbsolute.y, { width: s, height: a } = t ?? tr(e);
  if (r)
    return { x: o + s / 2, y: i + a / 2 };
  switch ((t == null ? void 0 : t.position) ?? n) {
    case $e.Top:
      return { x: o + s / 2, y: i };
    case $e.Right:
      return { x: o + s, y: i + a / 2 };
    case $e.Bottom:
      return { x: o + s / 2, y: i + a };
    case $e.Left:
      return { x: o, y: i + a / 2 };
  }
}
function wl(e, t) {
  return e && (t ? e.find((n) => n.id === t) : e[0]) || null;
}
function Vs(e, t) {
  return e ? typeof e == "string" ? e : `${t ? `${t}__` : ""}${Object.keys(e).sort().map((r) => `${r}=${e[r]}`).join("&")}` : "";
}
function M0(e, { id: t, defaultColor: n, defaultMarkerStart: r, defaultMarkerEnd: o }) {
  const i = /* @__PURE__ */ new Set();
  return e.reduce((s, a) => ([a.markerStart || r, a.markerEnd || o].forEach((l) => {
    if (l && typeof l == "object") {
      const u = Vs(l, t);
      i.has(u) || (s.push({ id: u, color: l.color || n, ...l }), i.add(u));
    }
  }), s), []).sort((s, a) => s.id.localeCompare(a.id));
}
function T0(e, t, n, r, o) {
  let i = 0.5;
  o === "start" ? i = 0 : o === "end" && (i = 1);
  let s = [
    (e.x + e.width * i) * t.zoom + t.x,
    e.y * t.zoom + t.y - r
  ], a = [-100 * i, -100];
  switch (n) {
    case $e.Right:
      s = [
        (e.x + e.width) * t.zoom + t.x + r,
        (e.y + e.height * i) * t.zoom + t.y
      ], a = [0, -100 * i];
      break;
    case $e.Bottom:
      s[1] = (e.y + e.height) * t.zoom + t.y + r, a[1] = 0;
      break;
    case $e.Left:
      s = [
        e.x * t.zoom + t.x - r,
        (e.y + e.height * i) * t.zoom + t.y
      ], a = [-100, -100 * i];
      break;
  }
  return `translate(${s[0]}px, ${s[1]}px) translate(${a[0]}%, ${a[1]}%)`;
}
const da = {
  nodeOrigin: [0, 0],
  nodeExtent: vi,
  elevateNodesOnSelect: !0,
  defaults: {}
}, H0 = {
  ...da,
  checkEquality: !0
};
function fa(e, t) {
  const n = { ...e };
  for (const r in t)
    t[r] !== void 0 && (n[r] = t[r]);
  return n;
}
function V0(e, t, n) {
  const r = fa(da, n);
  for (const o of e.values())
    if (o.parentId)
      ga(o, e, t, r);
    else {
      const i = Po(o, r.nodeOrigin), s = Or(o.extent) ? o.extent : r.nodeExtent, a = dr(i, s, tr(o));
      o.internals.positionAbsolute = a;
    }
}
function lc(e, t, n, r) {
  var a, l;
  const o = fa(H0, r), i = new Map(t), s = o != null && o.elevateNodesOnSelect ? 1e3 : 0;
  t.clear(), n.clear();
  for (const u of e) {
    let c = i.get(u.id);
    if (o.checkEquality && u === (c == null ? void 0 : c.internals.userNode))
      t.set(u.id, c);
    else {
      const f = Po(u, o.nodeOrigin), d = Or(u.extent) ? u.extent : o.nodeExtent, g = dr(f, d, tr(u));
      c = {
        ...o.defaults,
        ...u,
        measured: {
          width: (a = u.measured) == null ? void 0 : a.width,
          height: (l = u.measured) == null ? void 0 : l.height
        },
        internals: {
          positionAbsolute: g,
          // if user re-initializes the node or removes `measured` for whatever reason, we reset the handleBounds so that the node gets re-measured
          handleBounds: u.measured ? c == null ? void 0 : c.internals.handleBounds : void 0,
          z: uc(u, s),
          userNode: u
        }
      }, t.set(u.id, c);
    }
    u.parentId && ga(c, t, n, r);
  }
}
function D0(e, t) {
  if (!e.parentId)
    return;
  const n = t.get(e.parentId);
  n ? n.set(e.id, e) : t.set(e.parentId, /* @__PURE__ */ new Map([[e.id, e]]));
}
function ga(e, t, n, r) {
  const { elevateNodesOnSelect: o, nodeOrigin: i, nodeExtent: s } = fa(da, r), a = e.parentId, l = t.get(a);
  if (!l) {
    console.warn(`Parent node ${a} not found. Please make sure that parent nodes are in front of their child nodes in the nodes array.`);
    return;
  }
  D0(e, n);
  const u = o ? 1e3 : 0, { x: c, y: f, z: d } = A0(e, l, i, s, u), { positionAbsolute: g } = e.internals, p = c !== g.x || f !== g.y;
  (p || d !== e.internals.z) && t.set(e.id, {
    ...e,
    internals: {
      ...e.internals,
      positionAbsolute: p ? { x: c, y: f } : g,
      z: d
    }
  });
}
function uc(e, t) {
  return (Nn(e.zIndex) ? e.zIndex : 0) + (e.selected ? t : 0);
}
function A0(e, t, n, r, o) {
  const { x: i, y: s } = t.internals.positionAbsolute, a = tr(e), l = Po(e, n), u = Or(e.extent) ? dr(l, e.extent, a) : l;
  let c = dr({ x: i + u.x, y: s + u.y }, r, a);
  e.extent === "parent" && (c = ec(c, a, t));
  const f = uc(e, o), d = t.internals.z ?? 0;
  return {
    x: c.x,
    y: c.y,
    z: d > f ? d : f
  };
}
function L0(e, t, n, r = [0, 0]) {
  var s;
  const o = [], i = /* @__PURE__ */ new Map();
  for (const a of e) {
    const l = t.get(a.parentId);
    if (!l)
      continue;
    const u = ((s = i.get(a.parentId)) == null ? void 0 : s.expandedRect) ?? Lr(l), c = nc(u, a.rect);
    i.set(a.parentId, { expandedRect: c, parent: l });
  }
  return i.size > 0 && i.forEach(({ expandedRect: a, parent: l }, u) => {
    var _;
    const c = l.internals.positionAbsolute, f = tr(l), d = l.origin ?? r, g = a.x < c.x ? Math.round(Math.abs(c.x - a.x)) : 0, p = a.y < c.y ? Math.round(Math.abs(c.y - a.y)) : 0, x = Math.max(f.width, Math.round(a.width)), C = Math.max(f.height, Math.round(a.height)), $ = (x - f.width) * d[0], m = (C - f.height) * d[1];
    (g > 0 || p > 0 || $ || m) && (o.push({
      id: u,
      type: "position",
      position: {
        x: l.position.x - g + $,
        y: l.position.y - p + m
      }
    }), (_ = n.get(u)) == null || _.forEach((v) => {
      e.some((b) => b.id === v.id) || o.push({
        id: v.id,
        type: "position",
        position: {
          x: v.position.x + g,
          y: v.position.y + p
        }
      });
    })), (f.width < a.width || f.height < a.height || g || p) && o.push({
      id: u,
      type: "dimensions",
      setAttributes: !0,
      dimensions: {
        width: x + (g ? d[0] * g - $ : 0),
        height: C + (p ? d[1] * p - m : 0)
      }
    });
  }), o;
}
function O0(e, t, n, r, o, i) {
  const s = r == null ? void 0 : r.querySelector(".xyflow__viewport");
  let a = !1;
  if (!s)
    return { changes: [], updatedInternals: a };
  const l = [], u = window.getComputedStyle(s), { m22: c } = new window.DOMMatrixReadOnly(u.transform), f = [];
  for (const d of e.values()) {
    const g = t.get(d.id);
    if (!g)
      continue;
    if (g.hidden) {
      t.set(g.id, {
        ...g,
        internals: {
          ...g.internals,
          handleBounds: void 0
        }
      }), a = !0;
      continue;
    }
    const p = ca(d.nodeElement), x = g.measured.width !== p.width || g.measured.height !== p.height;
    if (!!(p.width && p.height && (x || !g.internals.handleBounds || d.force))) {
      const $ = d.nodeElement.getBoundingClientRect(), m = Or(g.extent) ? g.extent : i;
      let { positionAbsolute: _ } = g.internals;
      g.parentId && g.extent === "parent" ? _ = ec(_, p, t.get(g.parentId)) : m && (_ = dr(_, m, p));
      const v = {
        ...g,
        measured: p,
        internals: {
          ...g.internals,
          positionAbsolute: _,
          handleBounds: {
            source: gl("source", d.nodeElement, $, c, g.id),
            target: gl("target", d.nodeElement, $, c, g.id)
          }
        }
      };
      t.set(g.id, v), g.parentId && ga(v, t, n, { nodeOrigin: o }), a = !0, x && (l.push({
        id: g.id,
        type: "dimensions",
        dimensions: p
      }), g.expandParent && g.parentId && f.push({
        id: g.id,
        parentId: g.parentId,
        rect: Lr(v, o)
      }));
    }
  }
  if (f.length > 0) {
    const d = L0(f, t, n, o);
    l.push(...d);
  }
  return { changes: l, updatedInternals: a };
}
async function I0({ delta: e, panZoom: t, transform: n, translateExtent: r, width: o, height: i }) {
  if (!t || !e.x && !e.y)
    return Promise.resolve(!1);
  const s = await t.setViewportConstrained({
    x: n[0] + e.x,
    y: n[1] + e.y,
    zoom: n[2]
  }, [
    [0, 0],
    [o, i]
  ], r), a = !!s && (s.x !== n[0] || s.y !== n[1] || s.k !== n[2]);
  return Promise.resolve(a);
}
function _l(e, t, n, r, o, i) {
  let s = o;
  const a = r.get(s) || /* @__PURE__ */ new Map();
  r.set(s, a.set(n, t)), s = `${o}-${e}`;
  const l = r.get(s) || /* @__PURE__ */ new Map();
  if (r.set(s, l.set(n, t)), i) {
    s = `${o}-${e}-${i}`;
    const u = r.get(s) || /* @__PURE__ */ new Map();
    r.set(s, u.set(n, t));
  }
}
function cc(e, t, n) {
  e.clear(), t.clear();
  for (const r of n) {
    const { source: o, target: i, sourceHandle: s = null, targetHandle: a = null } = r, l = { edgeId: r.id, source: o, target: i, sourceHandle: s, targetHandle: a }, u = `${o}-${s}--${i}-${a}`, c = `${i}-${a}--${o}-${s}`;
    _l("source", l, c, e, o, s), _l("target", l, u, e, i, a), t.set(r.id, r);
  }
}
function z0(e, t) {
  if (e === null || t === null)
    return !1;
  const n = Array.isArray(e) ? e : [e], r = Array.isArray(t) ? t : [t];
  if (n.length !== r.length)
    return !1;
  for (let o = 0; o < n.length; o++)
    if (n[o].id !== r[o].id || n[o].type !== r[o].type || !Object.is(n[o].data, r[o].data))
      return !1;
  return !0;
}
function dc(e, t) {
  if (!e.parentId)
    return !1;
  const n = t.get(e.parentId);
  return n ? n.selected ? !0 : dc(n, t) : !1;
}
function xl(e, t, n) {
  var o;
  let r = e;
  do {
    if ((o = r == null ? void 0 : r.matches) != null && o.call(r, t))
      return !0;
    if (r === n)
      return !1;
    r = r == null ? void 0 : r.parentElement;
  } while (r);
  return !1;
}
function R0(e, t, n, r) {
  const o = /* @__PURE__ */ new Map();
  for (const [i, s] of e)
    if ((s.selected || s.id === r) && (!s.parentId || !dc(s, e)) && (s.draggable || t && typeof s.draggable > "u")) {
      const a = e.get(i);
      a && o.set(i, {
        id: i,
        position: a.position || { x: 0, y: 0 },
        distance: {
          x: n.x - a.internals.positionAbsolute.x,
          y: n.y - a.internals.positionAbsolute.y
        },
        extent: a.extent,
        parentId: a.parentId,
        origin: a.origin,
        expandParent: a.expandParent,
        internals: {
          positionAbsolute: a.internals.positionAbsolute || { x: 0, y: 0 }
        },
        measured: {
          width: a.measured.width ?? 0,
          height: a.measured.height ?? 0
        }
      });
    }
  return o;
}
function ss({ nodeId: e, dragItems: t, nodeLookup: n, dragging: r = !0 }) {
  var s, a, l;
  const o = [];
  for (const [u, c] of t) {
    const f = (s = n.get(u)) == null ? void 0 : s.internals.userNode;
    f && o.push({
      ...f,
      position: c.position,
      dragging: r
    });
  }
  if (!e)
    return [o[0], o];
  const i = (a = n.get(e)) == null ? void 0 : a.internals.userNode;
  return [
    i ? {
      ...i,
      position: ((l = t.get(e)) == null ? void 0 : l.position) || i.position,
      dragging: r
    } : o[0],
    o
  ];
}
function B0({ onNodeMouseDown: e, getStoreItems: t, onDragStart: n, onDrag: r, onDragStop: o }) {
  let i = { x: null, y: null }, s = 0, a = /* @__PURE__ */ new Map(), l = !1, u = { x: 0, y: 0 }, c = null, f = !1, d = null, g = !1;
  function p({ noDragClassName: C, handleSelector: $, domNode: m, isSelectable: _, nodeId: v, nodeClickDistance: b = 0 }) {
    d = Kt(m);
    function N({ x: V, y: A }, O) {
      const { nodeLookup: R, nodeExtent: S, snapGrid: T, snapToGrid: k, nodeOrigin: P, onNodeDrag: H, onSelectionDrag: I, onError: B, updateNodePositions: F } = t();
      i = { x: V, y: A };
      let K = !1, ie = { x: 0, y: 0, x2: 0, y2: 0 };
      if (a.size > 1 && S) {
        const ee = No(a);
        ie = Ts(ee);
      }
      for (const [ee, W] of a) {
        if (!R.has(ee))
          continue;
        let ue = { x: V - W.distance.x, y: A - W.distance.y };
        k && (ue = la(ue, T));
        let me = [
          [S[0][0], S[0][1]],
          [S[1][0], S[1][1]]
        ];
        if (a.size > 1 && S && !W.extent) {
          const { positionAbsolute: ze } = W.internals, G = ze.x - ie.x + S[0][0], se = ze.x + W.measured.width - ie.x2 + S[1][0], Te = ze.y - ie.y + S[0][1], Ae = ze.y + W.measured.height - ie.y2 + S[1][1];
          me = [
            [G, Te],
            [se, Ae]
          ];
        }
        const { position: Ce, positionAbsolute: ge } = h0({
          nodeId: ee,
          nextPosition: ue,
          nodeLookup: R,
          nodeExtent: me,
          nodeOrigin: P,
          onError: B
        });
        K = K || W.position.x !== Ce.x || W.position.y !== Ce.y, W.position = Ce, W.internals.positionAbsolute = ge;
      }
      if (K && (F(a, !0), O && (r || H || !v && I))) {
        const [ee, W] = ss({
          nodeId: v,
          dragItems: a,
          nodeLookup: R
        });
        r == null || r(O, a, ee, W), H == null || H(O, ee, W), v || I == null || I(O, W);
      }
    }
    async function E() {
      if (!c)
        return;
      const { transform: V, panBy: A, autoPanSpeed: O, autoPanOnNodeDrag: R } = t();
      if (!R) {
        l = !1, cancelAnimationFrame(s);
        return;
      }
      const [S, T] = tc(u, c, O);
      (S !== 0 || T !== 0) && (i.x = (i.x ?? 0) - S / V[2], i.y = (i.y ?? 0) - T / V[2], await A({ x: S, y: T }) && N(i, null)), s = requestAnimationFrame(E);
    }
    function M(V) {
      var K;
      const { nodeLookup: A, multiSelectionActive: O, nodesDraggable: R, transform: S, snapGrid: T, snapToGrid: k, selectNodesOnDrag: P, onNodeDragStart: H, onSelectionDragStart: I, unselectNodesAndEdges: B } = t();
      f = !0, (!P || !_) && !O && v && ((K = A.get(v)) != null && K.selected || B()), _ && P && v && (e == null || e(v));
      const F = is(V.sourceEvent, { transform: S, snapGrid: T, snapToGrid: k, containerBounds: c });
      if (i = F, a = R0(A, R, F, v), a.size > 0 && (n || H || !v && I)) {
        const [ie, ee] = ss({
          nodeId: v,
          dragItems: a,
          nodeLookup: A
        });
        n == null || n(V.sourceEvent, a, ie, ee), H == null || H(V.sourceEvent, ie, ee), v || I == null || I(V.sourceEvent, ee);
      }
    }
    const D = wh().clickDistance(b).on("start", (V) => {
      const { domNode: A, nodeDragThreshold: O, transform: R, snapGrid: S, snapToGrid: T } = t();
      c = (A == null ? void 0 : A.getBoundingClientRect()) || null, g = !1, O === 0 && M(V), i = is(V.sourceEvent, { transform: R, snapGrid: S, snapToGrid: T, containerBounds: c }), u = Hn(V.sourceEvent, c);
    }).on("drag", (V) => {
      const { autoPanOnNodeDrag: A, transform: O, snapGrid: R, snapToGrid: S, nodeDragThreshold: T, nodeLookup: k } = t(), P = is(V.sourceEvent, { transform: O, snapGrid: R, snapToGrid: S, containerBounds: c });
      if ((V.sourceEvent.type === "touchmove" && V.sourceEvent.touches.length > 1 || // if user deletes a node while dragging, we need to abort the drag to prevent errors
      v && !k.has(v)) && (g = !0), !g) {
        if (!l && A && f && (l = !0, E()), !f) {
          const H = P.xSnapped - (i.x ?? 0), I = P.ySnapped - (i.y ?? 0);
          Math.sqrt(H * H + I * I) > T && M(V);
        }
        (i.x !== P.xSnapped || i.y !== P.ySnapped) && a && f && (u = Hn(V.sourceEvent, c), N(P, V.sourceEvent));
      }
    }).on("end", (V) => {
      if (!(!f || g) && (l = !1, f = !1, cancelAnimationFrame(s), a.size > 0)) {
        const { nodeLookup: A, updateNodePositions: O, onNodeDragStop: R, onSelectionDragStop: S } = t();
        if (O(a, !1), o || R || !v && S) {
          const [T, k] = ss({
            nodeId: v,
            dragItems: a,
            nodeLookup: A,
            dragging: !1
          });
          o == null || o(V.sourceEvent, a, T, k), R == null || R(V.sourceEvent, T, k), v || S == null || S(V.sourceEvent, k);
        }
      }
    }).filter((V) => {
      const A = V.target;
      return !V.button && (!C || !xl(A, `.${C}`, m)) && (!$ || xl(A, $, m));
    });
    d.call(D);
  }
  function x() {
    d == null || d.on(".drag", null);
  }
  return {
    update: p,
    destroy: x
  };
}
function Y0(e, t, n) {
  const r = [], o = {
    x: e.x - n,
    y: e.y - n,
    width: n * 2,
    height: n * 2
  };
  for (const i of t.values())
    yo(o, Lr(i)) > 0 && r.push(i);
  return r;
}
const Z0 = 250;
function X0(e, t, n, r) {
  var a, l;
  let o = [], i = 1 / 0;
  const s = Y0(e, n, t + Z0);
  for (const u of s) {
    const c = [...((a = u.internals.handleBounds) == null ? void 0 : a.source) ?? [], ...((l = u.internals.handleBounds) == null ? void 0 : l.target) ?? []];
    for (const f of c) {
      if (r.nodeId === f.nodeId && r.type === f.type && r.id === f.id)
        continue;
      const { x: d, y: g } = wo(u, f, f.position, !0), p = Math.sqrt(Math.pow(d - e.x, 2) + Math.pow(g - e.y, 2));
      p > t || (p < i ? (o = [{ ...f, x: d, y: g }], i = p) : p === i && o.push({ ...f, x: d, y: g }));
    }
  }
  if (!o.length)
    return null;
  if (o.length > 1) {
    const u = r.type === "source" ? "target" : "source";
    return o.find((c) => c.type === u) ?? o[0];
  }
  return o[0];
}
function fc(e, t, n, r, o, i = !1) {
  var u, c, f;
  const s = r.get(e);
  if (!s)
    return null;
  const a = o === "strict" ? (u = s.internals.handleBounds) == null ? void 0 : u[t] : [...((c = s.internals.handleBounds) == null ? void 0 : c.source) ?? [], ...((f = s.internals.handleBounds) == null ? void 0 : f.target) ?? []], l = (n ? a == null ? void 0 : a.find((d) => d.id === n) : a == null ? void 0 : a[0]) ?? null;
  return l && i ? { ...l, ...wo(s, l, l.position, !0) } : l;
}
function gc(e, t) {
  return e || (t != null && t.classList.contains("target") ? "target" : t != null && t.classList.contains("source") ? "source" : null);
}
function F0(e, t) {
  let n = null;
  return t ? n = !0 : e && !t && (n = !1), n;
}
const hc = () => !0;
function W0(e, { connectionMode: t, connectionRadius: n, handleId: r, nodeId: o, edgeUpdaterType: i, isTarget: s, domNode: a, nodeLookup: l, lib: u, autoPanOnConnect: c, flowId: f, panBy: d, cancelConnection: g, onConnectStart: p, onConnect: x, onConnectEnd: C, isValidConnection: $ = hc, onReconnectEnd: m, updateConnection: _, getTransform: v, getFromHandle: b, autoPanSpeed: N }) {
  const E = m0(e.target);
  let M = 0, D;
  const { x: V, y: A } = Hn(e), O = E == null ? void 0 : E.elementFromPoint(V, A), R = gc(i, O), S = a == null ? void 0 : a.getBoundingClientRect();
  if (!S || !R)
    return;
  const T = fc(o, R, r, l, t);
  if (!T)
    return;
  let k = Hn(e, S), P = !1, H = null, I = !1, B = null;
  function F() {
    if (!c || !S)
      return;
    const [ge, ze] = tc(k, S, N);
    d({ x: ge, y: ze }), M = requestAnimationFrame(F);
  }
  const K = {
    ...T,
    nodeId: o,
    type: R,
    position: T.position
  }, ie = l.get(o), W = {
    inProgress: !0,
    isValid: null,
    from: wo(ie, K, $e.Left, !0),
    fromHandle: K,
    fromPosition: K.position,
    fromNode: ie,
    to: k,
    toHandle: null,
    toPosition: al[K.position],
    toNode: null
  };
  _(W);
  let ue = W;
  p == null || p(e, { nodeId: o, handleId: r, handleType: R });
  function me(ge) {
    if (!b() || !K) {
      Ce(ge);
      return;
    }
    const ze = v();
    k = Hn(ge, S), D = X0(Mo(k, ze, !1, [1, 1]), n, l, K), P || (F(), P = !0);
    const G = vc(ge, {
      handle: D,
      connectionMode: t,
      fromNodeId: o,
      fromHandleId: r,
      fromType: s ? "target" : "source",
      isValidConnection: $,
      doc: E,
      lib: u,
      flowId: f,
      nodeLookup: l
    });
    B = G.handleDomNode, H = G.connection, I = F0(!!D, G.isValid);
    const se = {
      // from stays the same
      ...ue,
      isValid: I,
      to: D && I ? rc({ x: D.x, y: D.y }, ze) : k,
      toHandle: G.toHandle,
      toPosition: I && G.toHandle ? G.toHandle.position : al[K.position],
      toNode: G.toHandle ? l.get(G.toHandle.nodeId) : null
    };
    I && D && ue.toHandle && se.toHandle && ue.toHandle.type === se.toHandle.type && ue.toHandle.nodeId === se.toHandle.nodeId && ue.toHandle.id === se.toHandle.id && ue.to.x === se.to.x && ue.to.y === se.to.y || (_(se), ue = se);
  }
  function Ce(ge) {
    (D || B) && H && I && (x == null || x(H));
    const { inProgress: ze, ...G } = ue, se = {
      ...G,
      toPosition: ue.toHandle ? ue.toPosition : null
    };
    C == null || C(ge, se), i && (m == null || m(ge, se)), g(), cancelAnimationFrame(M), P = !1, I = !1, H = null, B = null, E.removeEventListener("mousemove", me), E.removeEventListener("mouseup", Ce), E.removeEventListener("touchmove", me), E.removeEventListener("touchend", Ce);
  }
  E.addEventListener("mousemove", me), E.addEventListener("mouseup", Ce), E.addEventListener("touchmove", me), E.addEventListener("touchend", Ce);
}
function vc(e, { handle: t, connectionMode: n, fromNodeId: r, fromHandleId: o, fromType: i, doc: s, lib: a, flowId: l, isValidConnection: u = hc, nodeLookup: c }) {
  const f = i === "target", d = t ? s.querySelector(`.${a}-flow__handle[data-id="${l}-${t == null ? void 0 : t.nodeId}-${t == null ? void 0 : t.id}-${t == null ? void 0 : t.type}"]`) : null, { x: g, y: p } = Hn(e), x = s.elementFromPoint(g, p), C = x != null && x.classList.contains(`${a}-flow__handle`) ? x : d, $ = {
    handleDomNode: C,
    isValid: !1,
    connection: null,
    toHandle: null
  };
  if (C) {
    const m = gc(void 0, C), _ = C.getAttribute("data-nodeid"), v = C.getAttribute("data-handleid"), b = C.classList.contains("connectable"), N = C.classList.contains("connectableend");
    if (!_ || !m)
      return $;
    const E = {
      source: f ? _ : r,
      sourceHandle: f ? v : o,
      target: f ? r : _,
      targetHandle: f ? o : v
    };
    $.connection = E;
    const D = b && N && (n === cr.Strict ? f && m === "source" || !f && m === "target" : _ !== r || v !== o);
    $.isValid = D && u(E), $.toHandle = fc(_, m, v, c, n, !1);
  }
  return $;
}
const K0 = {
  onPointerDown: W0,
  isValid: vc
};
function q0({ domNode: e, panZoom: t, getTransform: n, getViewScale: r }) {
  const o = Kt(e);
  function i({ translateExtent: a, width: l, height: u, zoomStep: c = 10, pannable: f = !0, zoomable: d = !0, inversePan: g = !1 }) {
    const p = (_) => {
      const v = n();
      if (_.sourceEvent.type !== "wheel" || !t)
        return;
      const b = -_.sourceEvent.deltaY * (_.sourceEvent.deltaMode === 1 ? 0.05 : _.sourceEvent.deltaMode ? 1 : 2e-3) * c, N = v[2] * Math.pow(2, b);
      t.scaleTo(N);
    };
    let x = [0, 0];
    const C = (_) => {
      (_.sourceEvent.type === "mousedown" || _.sourceEvent.type === "touchstart") && (x = [
        _.sourceEvent.clientX ?? _.sourceEvent.touches[0].clientX,
        _.sourceEvent.clientY ?? _.sourceEvent.touches[0].clientY
      ]);
    }, $ = (_) => {
      const v = n();
      if (_.sourceEvent.type !== "mousemove" && _.sourceEvent.type !== "touchmove" || !t)
        return;
      const b = [
        _.sourceEvent.clientX ?? _.sourceEvent.touches[0].clientX,
        _.sourceEvent.clientY ?? _.sourceEvent.touches[0].clientY
      ], N = [b[0] - x[0], b[1] - x[1]];
      x = b;
      const E = r() * Math.max(v[2], Math.log(v[2])) * (g ? -1 : 1), M = {
        x: v[0] - N[0] * E,
        y: v[1] - N[1] * E
      }, D = [
        [0, 0],
        [l, u]
      ];
      t.setViewportConstrained({
        x: M.x,
        y: M.y,
        zoom: v[2]
      }, D, a);
    }, m = ju().on("start", C).on("zoom", f ? $ : null).on("zoom.wheel", d ? p : null);
    o.call(m, {});
  }
  function s() {
    o.on("zoom", null);
  }
  return {
    update: i,
    destroy: s,
    pointer: Qt
  };
}
const G0 = (e, t) => e.x !== t.x || e.y !== t.y || e.zoom !== t.k, Fi = (e) => ({
  x: e.x,
  y: e.y,
  zoom: e.k
}), as = ({ x: e, y: t, zoom: n }) => Yi.translate(e, t).scale(n), wr = (e, t) => e.target.closest(`.${t}`), pc = (e, t) => t === 2 && Array.isArray(e) && e.includes(2), ls = (e, t = 0, n = () => {
}) => {
  const r = typeof t == "number" && t > 0;
  return r || n(), r ? e.transition().duration(t).on("end", n) : e;
}, mc = (e) => {
  const t = e.ctrlKey && yi() ? 10 : 1;
  return -e.deltaY * (e.deltaMode === 1 ? 0.05 : e.deltaMode ? 1 : 2e-3) * t;
};
function U0({ zoomPanValues: e, noWheelClassName: t, d3Selection: n, d3Zoom: r, panOnScrollMode: o, panOnScrollSpeed: i, zoomOnPinch: s, onPanZoomStart: a, onPanZoom: l, onPanZoomEnd: u }) {
  return (c) => {
    if (wr(c, t))
      return !1;
    c.preventDefault(), c.stopImmediatePropagation();
    const f = n.property("__zoom").k || 1;
    if (c.ctrlKey && s) {
      const C = Qt(c), $ = mc(c), m = f * Math.pow(2, $);
      r.scaleTo(n, m, C, c);
      return;
    }
    const d = c.deltaMode === 1 ? 20 : 1;
    let g = o === qn.Vertical ? 0 : c.deltaX * d, p = o === qn.Horizontal ? 0 : c.deltaY * d;
    !yi() && c.shiftKey && o !== qn.Vertical && (g = c.deltaY * d, p = 0), r.translateBy(
      n,
      -(g / f) * i,
      -(p / f) * i,
      // @ts-ignore
      { internal: !0 }
    );
    const x = Fi(n.property("__zoom"));
    clearTimeout(e.panScrollTimeout), e.isPanScrolling || (e.isPanScrolling = !0, a == null || a(c, x)), e.isPanScrolling && (l == null || l(c, x), e.panScrollTimeout = setTimeout(() => {
      u == null || u(c, x), e.isPanScrolling = !1;
    }, 150));
  };
}
function j0({ noWheelClassName: e, preventScrolling: t, d3ZoomHandler: n }) {
  return function(r, o) {
    if (!t && r.type === "wheel" && !r.ctrlKey || wr(r, e))
      return null;
    r.preventDefault(), n.call(this, r, o);
  };
}
function J0({ zoomPanValues: e, onDraggingChange: t, onPanZoomStart: n }) {
  return (r) => {
    var i, s, a;
    if ((i = r.sourceEvent) != null && i.internal)
      return;
    const o = Fi(r.transform);
    e.mouseButton = ((s = r.sourceEvent) == null ? void 0 : s.button) || 0, e.isZoomingOrPanning = !0, e.prevViewport = o, ((a = r.sourceEvent) == null ? void 0 : a.type) === "mousedown" && t(!0), n && (n == null || n(r.sourceEvent, o));
  };
}
function Q0({ zoomPanValues: e, panOnDrag: t, onPaneContextMenu: n, onTransformChange: r, onPanZoom: o }) {
  return (i) => {
    var s, a;
    e.usedRightMouseButton = !!(n && pc(t, e.mouseButton ?? 0)), (s = i.sourceEvent) != null && s.sync || r([i.transform.x, i.transform.y, i.transform.k]), o && !((a = i.sourceEvent) != null && a.internal) && (o == null || o(i.sourceEvent, Fi(i.transform)));
  };
}
function e2({ zoomPanValues: e, panOnDrag: t, panOnScroll: n, onDraggingChange: r, onPanZoomEnd: o, onPaneContextMenu: i }) {
  return (s) => {
    var a;
    if (!((a = s.sourceEvent) != null && a.internal) && (e.isZoomingOrPanning = !1, i && pc(t, e.mouseButton ?? 0) && !e.usedRightMouseButton && s.sourceEvent && i(s.sourceEvent), e.usedRightMouseButton = !1, r(!1), o && G0(e.prevViewport, s.transform))) {
      const l = Fi(s.transform);
      e.prevViewport = l, clearTimeout(e.timerId), e.timerId = setTimeout(
        () => {
          o == null || o(s.sourceEvent, l);
        },
        // we need a setTimeout for panOnScroll to supress multiple end events fired during scroll
        n ? 150 : 0
      );
    }
  };
}
function t2({ zoomActivationKeyPressed: e, zoomOnScroll: t, zoomOnPinch: n, panOnDrag: r, panOnScroll: o, zoomOnDoubleClick: i, userSelectionActive: s, noWheelClassName: a, noPanClassName: l, lib: u }) {
  return (c) => {
    var p;
    const f = e || t, d = n && c.ctrlKey;
    if (c.button === 1 && c.type === "mousedown" && (wr(c, `${u}-flow__node`) || wr(c, `${u}-flow__edge`)))
      return !0;
    if (!r && !f && !o && !i && !n || s || wr(c, a) && c.type === "wheel" || wr(c, l) && (c.type !== "wheel" || o && c.type === "wheel" && !e) || !n && c.ctrlKey && c.type === "wheel")
      return !1;
    if (!n && c.type === "touchstart" && ((p = c.touches) == null ? void 0 : p.length) > 1)
      return c.preventDefault(), !1;
    if (!f && !o && !d && c.type === "wheel" || !r && (c.type === "mousedown" || c.type === "touchstart") || Array.isArray(r) && !r.includes(c.button) && c.type === "mousedown")
      return !1;
    const g = Array.isArray(r) && r.includes(c.button) || !c.button || c.button <= 1;
    return (!c.ctrlKey || c.type === "wheel") && g;
  };
}
function n2({ domNode: e, minZoom: t, maxZoom: n, paneClickDistance: r, translateExtent: o, viewport: i, onPanZoom: s, onPanZoomStart: a, onPanZoomEnd: l, onDraggingChange: u }) {
  const c = {
    isZoomingOrPanning: !1,
    usedRightMouseButton: !1,
    prevViewport: { x: 0, y: 0, zoom: 0 },
    mouseButton: 0,
    timerId: void 0,
    panScrollTimeout: void 0,
    isPanScrolling: !1
  }, f = e.getBoundingClientRect(), d = ju().clickDistance(!Nn(r) || r < 0 ? 0 : r).scaleExtent([t, n]).translateExtent(o), g = Kt(e).call(d);
  _({
    x: i.x,
    y: i.y,
    zoom: Ar(i.zoom, t, n)
  }, [
    [0, 0],
    [f.width, f.height]
  ], o);
  const p = g.on("wheel.zoom"), x = g.on("dblclick.zoom");
  d.wheelDelta(mc);
  function C(O, R) {
    return g ? new Promise((S) => {
      d == null || d.transform(ls(g, R == null ? void 0 : R.duration, () => S(!0)), O);
    }) : Promise.resolve(!1);
  }
  function $({ noWheelClassName: O, noPanClassName: R, onPaneContextMenu: S, userSelectionActive: T, panOnScroll: k, panOnDrag: P, panOnScrollMode: H, panOnScrollSpeed: I, preventScrolling: B, zoomOnPinch: F, zoomOnScroll: K, zoomOnDoubleClick: ie, zoomActivationKeyPressed: ee, lib: W, onTransformChange: ue }) {
    T && !c.isZoomingOrPanning && m();
    const Ce = k && !ee && !T ? U0({
      zoomPanValues: c,
      noWheelClassName: O,
      d3Selection: g,
      d3Zoom: d,
      panOnScrollMode: H,
      panOnScrollSpeed: I,
      zoomOnPinch: F,
      onPanZoomStart: a,
      onPanZoom: s,
      onPanZoomEnd: l
    }) : j0({
      noWheelClassName: O,
      preventScrolling: B,
      d3ZoomHandler: p
    });
    if (g.on("wheel.zoom", Ce, { passive: !1 }), !T) {
      const ze = J0({
        zoomPanValues: c,
        onDraggingChange: u,
        onPanZoomStart: a
      });
      d.on("start", ze);
      const G = Q0({
        zoomPanValues: c,
        panOnDrag: P,
        onPaneContextMenu: !!S,
        onPanZoom: s,
        onTransformChange: ue
      });
      d.on("zoom", G);
      const se = e2({
        zoomPanValues: c,
        panOnDrag: P,
        panOnScroll: k,
        onPaneContextMenu: S,
        onPanZoomEnd: l,
        onDraggingChange: u
      });
      d.on("end", se);
    }
    const ge = t2({
      zoomActivationKeyPressed: ee,
      panOnDrag: P,
      zoomOnScroll: K,
      panOnScroll: k,
      zoomOnDoubleClick: ie,
      zoomOnPinch: F,
      userSelectionActive: T,
      noPanClassName: R,
      noWheelClassName: O,
      lib: W
    });
    d.filter(ge), ie ? g.on("dblclick.zoom", x) : g.on("dblclick.zoom", null);
  }
  function m() {
    d.on("zoom", null);
  }
  async function _(O, R, S) {
    const T = as(O), k = d == null ? void 0 : d.constrain()(T, R, S);
    return k && await C(k), new Promise((P) => P(k));
  }
  async function v(O, R) {
    const S = as(O);
    return await C(S, R), new Promise((T) => T(S));
  }
  function b(O) {
    if (g) {
      const R = as(O), S = g.property("__zoom");
      (S.k !== O.zoom || S.x !== O.x || S.y !== O.y) && (d == null || d.transform(g, R, null, { sync: !0 }));
    }
  }
  function N() {
    const O = g ? Uu(g.node()) : { x: 0, y: 0, k: 1 };
    return { x: O.x, y: O.y, zoom: O.k };
  }
  function E(O, R) {
    return g ? new Promise((S) => {
      d == null || d.scaleTo(ls(g, R == null ? void 0 : R.duration, () => S(!0)), O);
    }) : Promise.resolve(!1);
  }
  function M(O, R) {
    return g ? new Promise((S) => {
      d == null || d.scaleBy(ls(g, R == null ? void 0 : R.duration, () => S(!0)), O);
    }) : Promise.resolve(!1);
  }
  function D(O) {
    d == null || d.scaleExtent(O);
  }
  function V(O) {
    d == null || d.translateExtent(O);
  }
  function A(O) {
    const R = !Nn(O) || O < 0 ? 0 : O;
    d == null || d.clickDistance(R);
  }
  return {
    update: $,
    destroy: m,
    setViewport: v,
    setViewportConstrained: _,
    getViewport: N,
    scaleTo: E,
    scaleBy: M,
    setScaleExtent: D,
    setTranslateExtent: V,
    syncViewport: b,
    setClickDistance: A
  };
}
var bl;
(function(e) {
  e.Line = "line", e.Handle = "handle";
})(bl || (bl = {}));
var r2 = /* @__PURE__ */ ne('<div role="button" tabindex="-1"><!></div>');
function Qn(e, t) {
  de(t, !1);
  const [n, r] = tt(), o = () => Q(ie, "$connectable", n), i = () => Q(Ce, "$connectionRadius", n), s = () => Q(ue, "$domNode", n), a = () => Q(me, "$nodeLookup", n), l = () => Q(W, "$connectionMode", n), u = () => Q(G, "$lib", n), c = () => Q(Fe, "$autoPanOnConnect", n), f = () => Q(Oe, "$flowId", n), d = () => Q(ze, "$isValidConnectionStore", n), g = () => Q(Te, "$onedgecreate", n), p = () => Q(oe, "$onConnectAction", n), x = () => Q(ve, "$onConnectStartAction", n), C = () => Q(xe, "$onConnectEndAction", n), $ = () => Q(ge, "$viewport", n), m = () => Q(ct, "$connection", n), _ = () => Q(Le, "$edges", n), v = () => Q(Qe, "$connectionLookup", n), b = re(), N = re(), E = re(), M = re(), D = re(), V = re(), A = re(), O = re();
  let R = w(t, "id", 12, void 0), S = w(t, "type", 12, "source"), T = w(t, "position", 28, () => $e.Top), k = w(t, "style", 12, void 0), P = w(t, "isValidConnection", 12, void 0), H = w(t, "onconnect", 12, void 0), I = w(t, "ondisconnect", 12, void 0), B = w(t, "isConnectable", 12, void 0), F = w(t, "class", 12, void 0);
  const K = ar("svelteflow__node_id"), ie = ar("svelteflow__node_connectable"), ee = Ue(), {
    connectionMode: W,
    domNode: ue,
    nodeLookup: me,
    connectionRadius: Ce,
    viewport: ge,
    isValidConnection: ze,
    lib: G,
    addEdge: se,
    onedgecreate: Te,
    panBy: Ae,
    cancelConnection: Xe,
    updateConnection: te,
    autoPanOnConnect: Fe,
    edges: Le,
    connectionLookup: Qe,
    onconnect: oe,
    onconnectstart: ve,
    onconnectend: xe,
    flowId: Oe,
    connection: ct
  } = ee;
  function lt(Ne) {
    const rt = ic(Ne);
    (rt && Ne.button === 0 || !rt) && K0.onPointerDown(Ne, {
      handleId: h(E),
      nodeId: K,
      isTarget: h(b),
      connectionRadius: i(),
      domNode: s(),
      nodeLookup: a(),
      connectionMode: l(),
      lib: u(),
      autoPanOnConnect: c(),
      flowId: f(),
      isValidConnection: P() ?? d(),
      updateConnection: te,
      cancelConnection: Xe,
      panBy: Ae,
      onConnect: (ye) => {
        var at;
        const ot = g() ? g()(ye) : ye;
        ot && (se(ot), (at = p()) == null || at(ye));
      },
      onConnectStart: (ye, ot) => {
        var at;
        (at = x()) == null || at(ye, {
          nodeId: ot.nodeId,
          handleId: ot.handleId,
          handleType: ot.handleType
        });
      },
      onConnectEnd: (ye, ot) => {
        var at;
        (at = C()) == null || at(ye, ot);
      },
      getTransform: () => [
        $().x,
        $().y,
        $().zoom
      ],
      getFromHandle: () => m().fromHandle
    });
  }
  let J = re(null), Re = re();
  he(() => j(S()), () => {
    U(b, S() === "target");
  }), he(
    () => (j(B()), o()),
    () => {
      U(N, B() !== void 0 ? B() : o());
    }
  ), he(() => j(R()), () => {
    U(E, R() || null);
  }), he(
    () => (j(H()), j(I()), _(), v(), j(S()), j(R())),
    () => {
      (H() || I()) && (_(), U(Re, v().get(`${K}-${S()}${R() ? `-${R()}` : ""}`)));
    }
  ), he(
    () => (h(J), h(Re), j(I()), j(H())),
    () => {
      if (h(J) && !u0(h(Re), h(J))) {
        const Ne = h(Re) ?? /* @__PURE__ */ new Map();
        ll(h(J), Ne, I()), ll(Ne, h(J), H());
      }
      U(J, h(Re) ?? /* @__PURE__ */ new Map());
    }
  ), he(() => m(), () => {
    U(M, !!m().fromHandle);
  }), he(
    () => (m(), j(S()), h(E)),
    () => {
      var Ne, rt, ye;
      U(D, ((Ne = m().fromHandle) == null ? void 0 : Ne.nodeId) === K && ((rt = m().fromHandle) == null ? void 0 : rt.type) === S() && ((ye = m().fromHandle) == null ? void 0 : ye.id) === h(E));
    }
  ), he(
    () => (m(), j(S()), h(E)),
    () => {
      var Ne, rt, ye;
      U(V, ((Ne = m().toHandle) == null ? void 0 : Ne.nodeId) === K && ((rt = m().toHandle) == null ? void 0 : rt.type) === S() && ((ye = m().toHandle) == null ? void 0 : ye.id) === h(E));
    }
  ), he(
    () => (l(), m(), j(S()), h(E)),
    () => {
      var Ne, rt, ye;
      U(A, l() === cr.Strict ? ((Ne = m().fromHandle) == null ? void 0 : Ne.type) !== S() : K !== ((rt = m().fromHandle) == null ? void 0 : rt.nodeId) || h(E) !== ((ye = m().fromHandle) == null ? void 0 : ye.id));
    }
  ), he(() => (h(V), m()), () => {
    U(O, h(V) && m().isValid);
  }), gt(), He();
  var le = r2();
  ce(le, "data-nodeid", K);
  let fn;
  var Ut = X(le);
  pt(Ut, t, "default", {}), Z(le), Ee(
    (Ne) => {
      ce(le, "data-handleid", h(E)), ce(le, "data-handlepos", T()), ce(le, "data-id", `${f() ?? ""}-${K ?? ""}-${R() || ""}-${S() ?? ""}`), fn = kt(le, 1, bn(Ne), null, fn, {
        valid: h(O),
        connectingto: h(V),
        connectingfrom: h(D),
        source: !h(b),
        target: h(b),
        connectablestart: h(N),
        connectableend: h(N),
        connectable: h(N),
        connectionindicator: h(N) && (!h(M) || h(A))
      }), ce(le, "style", k());
    },
    [
      () => Et([
        "svelte-flow__handle",
        `svelte-flow__handle-${T()}`,
        "nodrag",
        "nopan",
        T(),
        F()
      ])
    ],
    pe
  ), Ye("mousedown", le, lt), Ye("touchstart", le, lt), L(e, le);
  var gn = fe({
    get id() {
      return R();
    },
    set id(Ne) {
      R(Ne), y();
    },
    get type() {
      return S();
    },
    set type(Ne) {
      S(Ne), y();
    },
    get position() {
      return T();
    },
    set position(Ne) {
      T(Ne), y();
    },
    get style() {
      return k();
    },
    set style(Ne) {
      k(Ne), y();
    },
    get isValidConnection() {
      return P();
    },
    set isValidConnection(Ne) {
      P(Ne), y();
    },
    get onconnect() {
      return H();
    },
    set onconnect(Ne) {
      H(Ne), y();
    },
    get ondisconnect() {
      return I();
    },
    set ondisconnect(Ne) {
      I(Ne), y();
    },
    get isConnectable() {
      return B();
    },
    set isConnectable(Ne) {
      B(Ne), y();
    },
    get class() {
      return F();
    },
    set class(Ne) {
      F(Ne), y();
    }
  });
  return r(), gn;
}
ae(
  Qn,
  {
    id: {},
    type: {},
    position: {},
    style: {},
    isValidConnection: {},
    onconnect: {},
    ondisconnect: {},
    isConnectable: {},
    class: {}
  },
  ["default"],
  [],
  !0
);
var o2 = /* @__PURE__ */ ne("<!> <!>", 1);
function _i(e, t) {
  const n = nt(t, [
    "children",
    "$$slots",
    "$$events",
    "$$legacy",
    "$$host"
  ]);
  nt(n, ["data", "targetPosition", "sourcePosition"]), de(t, !1);
  let r = w(t, "data", 28, () => ({ label: "Node" })), o = w(t, "targetPosition", 12, void 0), i = w(t, "sourcePosition", 12, void 0);
  He();
  var s = o2(), a = be(s);
  const l = /* @__PURE__ */ pe(() => o() ?? $e.Top);
  Qn(a, {
    type: "target",
    get position() {
      return h(l);
    }
  });
  var u = z(a), c = z(u);
  const f = /* @__PURE__ */ pe(() => i() ?? $e.Bottom);
  return Qn(c, {
    type: "source",
    get position() {
      return h(f);
    }
  }), Ee(() => {
    var d;
    return Rt(u, ` ${((d = r()) == null ? void 0 : d.label) ?? ""} `);
  }), L(e, s), fe({
    get data() {
      return r();
    },
    set data(d) {
      r(d), y();
    },
    get targetPosition() {
      return o();
    },
    set targetPosition(d) {
      o(d), y();
    },
    get sourcePosition() {
      return i();
    },
    set sourcePosition(d) {
      i(d), y();
    }
  });
}
ae(
  _i,
  {
    data: {},
    targetPosition: {},
    sourcePosition: {}
  },
  [],
  [],
  !0
);
var i2 = /* @__PURE__ */ ne(" <!>", 1);
function yc(e, t) {
  const n = nt(t, [
    "children",
    "$$slots",
    "$$events",
    "$$legacy",
    "$$host"
  ]);
  nt(n, ["data", "sourcePosition"]), de(t, !1);
  let r = w(t, "data", 28, () => ({ label: "Node" })), o = w(t, "sourcePosition", 12, void 0);
  He(), Se();
  var i = i2(), s = be(i), a = z(s);
  const l = /* @__PURE__ */ pe(() => o() ?? $e.Bottom);
  return Qn(a, {
    type: "source",
    get position() {
      return h(l);
    }
  }), Ee(() => {
    var u;
    return Rt(s, `${((u = r()) == null ? void 0 : u.label) ?? ""} `);
  }), L(e, i), fe({
    get data() {
      return r();
    },
    set data(u) {
      r(u), y();
    },
    get sourcePosition() {
      return o();
    },
    set sourcePosition(u) {
      o(u), y();
    }
  });
}
ae(yc, { data: {}, sourcePosition: {} }, [], [], !0);
var s2 = /* @__PURE__ */ ne(" <!>", 1);
function wc(e, t) {
  const n = nt(t, [
    "children",
    "$$slots",
    "$$events",
    "$$legacy",
    "$$host"
  ]);
  nt(n, ["data", "targetPosition"]), de(t, !1);
  let r = w(t, "data", 28, () => ({ label: "Node" })), o = w(t, "targetPosition", 12, void 0);
  He(), Se();
  var i = s2(), s = be(i), a = z(s);
  const l = /* @__PURE__ */ pe(() => o() ?? $e.Top);
  return Qn(a, {
    type: "target",
    get position() {
      return h(l);
    }
  }), Ee(() => {
    var u;
    return Rt(s, `${((u = r()) == null ? void 0 : u.label) ?? ""} `);
  }), L(e, i), fe({
    get data() {
      return r();
    },
    set data(u) {
      r(u), y();
    },
    get targetPosition() {
      return o();
    },
    set targetPosition(u) {
      o(u), y();
    }
  });
}
ae(wc, { data: {}, targetPosition: {} }, [], [], !0);
function _c(e, t) {
  const n = nt(t, [
    "children",
    "$$slots",
    "$$events",
    "$$legacy",
    "$$host"
  ]);
  nt(n, []);
}
ae(_c, {}, [], [], !0);
function Cl(e, t, n) {
  if (!t)
    return;
  const r = n ? t.querySelector(n) : t;
  r && r.appendChild(e);
}
function kr(e, { target: t, domNode: n }) {
  return Cl(e, n, t), {
    async update({ target: r, domNode: o }) {
      Cl(e, o, r);
    },
    destroy() {
      e.parentNode && e.parentNode.removeChild(e);
    }
  };
}
var a2 = /* @__PURE__ */ ne("<div><!></div>");
function xc(e, t) {
  de(t, !1);
  const [n, r] = tt(), o = () => Q(i, "$domNode", n), { domNode: i } = Ue();
  He();
  var s = a2(), a = X(s);
  pt(a, t, "default", {}), Z(s), vt(s, (l, u) => kr == null ? void 0 : kr(l, u), () => ({
    target: ".svelte-flow__edgelabel-renderer",
    domNode: o()
  })), L(e, s), fe(), r();
}
ae(xc, {}, ["default"], [], !0);
function bc() {
  const { edgeLookup: e, selectionRect: t, selectionRectMode: n, multiselectionKeyPressed: r, addSelectedEdges: o, unselectNodesAndEdges: i, elementsSelectable: s } = Ue();
  return (a) => {
    const l = q(e).get(a);
    if (!l) {
      console.warn("012", Dr.error012(a));
      return;
    }
    (l.selectable || q(s) && typeof l.selectable > "u") && (t.set(null), n.set(null), l.selected ? l.selected && q(r) && i({ nodes: [], edges: [l] }) : o([a]));
  };
}
var l2 = /* @__PURE__ */ ne('<div class="svelte-flow__edge-label" role="button" tabindex="-1"><!></div>');
function Cc(e, t) {
  de(t, !1);
  let n = w(t, "style", 12, void 0), r = w(t, "x", 12, void 0), o = w(t, "y", 12, void 0);
  const i = bc(), s = ar("svelteflow__edge_id");
  return He(), xc(e, {
    children: (a, l) => {
      var u = l2(), c = X(u);
      pt(c, t, "default", {}), Z(u), Ee(() => {
        ce(u, "style", "pointer-events: all;" + n()), st(u, "transform", `translate(-50%, -50%) translate(${r() ?? ""}px,${o() ?? ""}px)`);
      }), Ye("keyup", u, () => {
      }), Ye("click", u, () => {
        s && i(s);
      }), L(a, u);
    },
    $$slots: { default: !0 }
  }), fe({
    get style() {
      return n();
    },
    set style(a) {
      n(a), y();
    },
    get x() {
      return r();
    },
    set x(a) {
      r(a), y();
    },
    get y() {
      return o();
    },
    set y(a) {
      o(a), y();
    }
  });
}
ae(Cc, { style: {}, x: {}, y: {} }, ["default"], [], !0);
var u2 = /* @__PURE__ */ _e('<path fill="none" class="svelte-flow__edge-interaction"></path>'), c2 = /* @__PURE__ */ _e('<path fill="none"></path><!><!>', 1);
function To(e, t) {
  de(t, !1);
  let n = w(t, "id", 12, void 0), r = w(t, "path", 12), o = w(t, "label", 12, void 0), i = w(t, "labelX", 12, void 0), s = w(t, "labelY", 12, void 0), a = w(t, "labelStyle", 12, void 0), l = w(t, "markerStart", 12, void 0), u = w(t, "markerEnd", 12, void 0), c = w(t, "style", 12, void 0), f = w(t, "interactionWidth", 12, 20), d = w(t, "class", 12, void 0), g = f() === void 0 ? 20 : f();
  He();
  var p = c2(), x = be(p), C = z(x);
  {
    var $ = (v) => {
      var b = u2();
      ce(b, "stroke-opacity", 0), ce(b, "stroke-width", g), Ee(() => ce(b, "d", r())), L(v, b);
    };
    ke(C, (v) => {
      g && v($);
    });
  }
  var m = z(C);
  {
    var _ = (v) => {
      Cc(v, {
        get x() {
          return i();
        },
        get y() {
          return s();
        },
        get style() {
          return a();
        },
        children: (b, N) => {
          Se();
          var E = Ie();
          Ee(() => Rt(E, o())), L(b, E);
        },
        $$slots: { default: !0 }
      });
    };
    ke(m, (v) => {
      o() && v(_);
    });
  }
  return Ee(
    (v) => {
      ce(x, "id", n()), ce(x, "d", r()), kt(x, 0, bn(v)), ce(x, "marker-start", l()), ce(x, "marker-end", u()), ce(x, "style", c());
    },
    [
      () => Et(["svelte-flow__edge-path", d()])
    ],
    pe
  ), L(e, p), fe({
    get id() {
      return n();
    },
    set id(v) {
      n(v), y();
    },
    get path() {
      return r();
    },
    set path(v) {
      r(v), y();
    },
    get label() {
      return o();
    },
    set label(v) {
      o(v), y();
    },
    get labelX() {
      return i();
    },
    set labelX(v) {
      i(v), y();
    },
    get labelY() {
      return s();
    },
    set labelY(v) {
      s(v), y();
    },
    get labelStyle() {
      return a();
    },
    set labelStyle(v) {
      a(v), y();
    },
    get markerStart() {
      return l();
    },
    set markerStart(v) {
      l(v), y();
    },
    get markerEnd() {
      return u();
    },
    set markerEnd(v) {
      u(v), y();
    },
    get style() {
      return c();
    },
    set style(v) {
      c(v), y();
    },
    get interactionWidth() {
      return f();
    },
    set interactionWidth(v) {
      f(v), y();
    },
    get class() {
      return d();
    },
    set class(v) {
      d(v), y();
    }
  });
}
ae(
  To,
  {
    id: {},
    path: {},
    label: {},
    labelX: {},
    labelY: {},
    labelStyle: {},
    markerStart: {},
    markerEnd: {},
    style: {},
    interactionWidth: {},
    class: {}
  },
  [],
  [],
  !0
);
function xi(e, t) {
  const n = nt(t, [
    "children",
    "$$slots",
    "$$events",
    "$$legacy",
    "$$host"
  ]);
  nt(n, [
    "label",
    "labelStyle",
    "style",
    "markerStart",
    "markerEnd",
    "interactionWidth",
    "sourceX",
    "sourceY",
    "sourcePosition",
    "targetX",
    "targetY",
    "targetPosition"
  ]), de(t, !1);
  const r = re(), o = re(), i = re();
  let s = w(t, "label", 12, void 0), a = w(t, "labelStyle", 12, void 0), l = w(t, "style", 12, void 0), u = w(t, "markerStart", 12, void 0), c = w(t, "markerEnd", 12, void 0), f = w(t, "interactionWidth", 12, void 0), d = w(t, "sourceX", 12), g = w(t, "sourceY", 12), p = w(t, "sourcePosition", 12), x = w(t, "targetX", 12), C = w(t, "targetY", 12), $ = w(t, "targetPosition", 12);
  return he(
    () => (h(r), h(o), h(i), j(d()), j(g()), j(x()), j(C()), j(p()), j($())),
    () => {
      ((m) => (U(r, m[0]), U(o, m[1]), U(i, m[2])))(sc({
        sourceX: d(),
        sourceY: g(),
        targetX: x(),
        targetY: C(),
        sourcePosition: p(),
        targetPosition: $()
      }));
    }
  ), gt(), He(), To(e, {
    get path() {
      return h(r);
    },
    get labelX() {
      return h(o);
    },
    get labelY() {
      return h(i);
    },
    get label() {
      return s();
    },
    get labelStyle() {
      return a();
    },
    get markerStart() {
      return u();
    },
    get markerEnd() {
      return c();
    },
    get interactionWidth() {
      return f();
    },
    get style() {
      return l();
    }
  }), fe({
    get label() {
      return s();
    },
    set label(m) {
      s(m), y();
    },
    get labelStyle() {
      return a();
    },
    set labelStyle(m) {
      a(m), y();
    },
    get style() {
      return l();
    },
    set style(m) {
      l(m), y();
    },
    get markerStart() {
      return u();
    },
    set markerStart(m) {
      u(m), y();
    },
    get markerEnd() {
      return c();
    },
    set markerEnd(m) {
      c(m), y();
    },
    get interactionWidth() {
      return f();
    },
    set interactionWidth(m) {
      f(m), y();
    },
    get sourceX() {
      return d();
    },
    set sourceX(m) {
      d(m), y();
    },
    get sourceY() {
      return g();
    },
    set sourceY(m) {
      g(m), y();
    },
    get sourcePosition() {
      return p();
    },
    set sourcePosition(m) {
      p(m), y();
    },
    get targetX() {
      return x();
    },
    set targetX(m) {
      x(m), y();
    },
    get targetY() {
      return C();
    },
    set targetY(m) {
      C(m), y();
    },
    get targetPosition() {
      return $();
    },
    set targetPosition(m) {
      $(m), y();
    }
  });
}
ae(
  xi,
  {
    label: {},
    labelStyle: {},
    style: {},
    markerStart: {},
    markerEnd: {},
    interactionWidth: {},
    sourceX: {},
    sourceY: {},
    sourcePosition: {},
    targetX: {},
    targetY: {},
    targetPosition: {}
  },
  [],
  [],
  !0
);
function kc(e, t) {
  const n = nt(t, [
    "children",
    "$$slots",
    "$$events",
    "$$legacy",
    "$$host"
  ]);
  nt(n, [
    "label",
    "labelStyle",
    "style",
    "markerStart",
    "markerEnd",
    "interactionWidth",
    "sourceX",
    "sourceY",
    "sourcePosition",
    "targetX",
    "targetY",
    "targetPosition"
  ]), de(t, !1);
  const r = re(), o = re(), i = re();
  let s = w(t, "label", 12, void 0), a = w(t, "labelStyle", 12, void 0), l = w(t, "style", 12, void 0), u = w(t, "markerStart", 12, void 0), c = w(t, "markerEnd", 12, void 0), f = w(t, "interactionWidth", 12, void 0), d = w(t, "sourceX", 12), g = w(t, "sourceY", 12), p = w(t, "sourcePosition", 12), x = w(t, "targetX", 12), C = w(t, "targetY", 12), $ = w(t, "targetPosition", 12);
  return he(
    () => (h(r), h(o), h(i), j(d()), j(g()), j(x()), j(C()), j(p()), j($())),
    () => {
      ((m) => (U(r, m[0]), U(o, m[1]), U(i, m[2])))(wi({
        sourceX: d(),
        sourceY: g(),
        targetX: x(),
        targetY: C(),
        sourcePosition: p(),
        targetPosition: $()
      }));
    }
  ), gt(), He(), To(e, {
    get path() {
      return h(r);
    },
    get labelX() {
      return h(o);
    },
    get labelY() {
      return h(i);
    },
    get label() {
      return s();
    },
    get labelStyle() {
      return a();
    },
    get markerStart() {
      return u();
    },
    get markerEnd() {
      return c();
    },
    get interactionWidth() {
      return f();
    },
    get style() {
      return l();
    }
  }), fe({
    get label() {
      return s();
    },
    set label(m) {
      s(m), y();
    },
    get labelStyle() {
      return a();
    },
    set labelStyle(m) {
      a(m), y();
    },
    get style() {
      return l();
    },
    set style(m) {
      l(m), y();
    },
    get markerStart() {
      return u();
    },
    set markerStart(m) {
      u(m), y();
    },
    get markerEnd() {
      return c();
    },
    set markerEnd(m) {
      c(m), y();
    },
    get interactionWidth() {
      return f();
    },
    set interactionWidth(m) {
      f(m), y();
    },
    get sourceX() {
      return d();
    },
    set sourceX(m) {
      d(m), y();
    },
    get sourceY() {
      return g();
    },
    set sourceY(m) {
      g(m), y();
    },
    get sourcePosition() {
      return p();
    },
    set sourcePosition(m) {
      p(m), y();
    },
    get targetX() {
      return x();
    },
    set targetX(m) {
      x(m), y();
    },
    get targetY() {
      return C();
    },
    set targetY(m) {
      C(m), y();
    },
    get targetPosition() {
      return $();
    },
    set targetPosition(m) {
      $(m), y();
    }
  });
}
ae(
  kc,
  {
    label: {},
    labelStyle: {},
    style: {},
    markerStart: {},
    markerEnd: {},
    interactionWidth: {},
    sourceX: {},
    sourceY: {},
    sourcePosition: {},
    targetX: {},
    targetY: {},
    targetPosition: {}
  },
  [],
  [],
  !0
);
function $c(e, t) {
  const n = nt(t, [
    "children",
    "$$slots",
    "$$events",
    "$$legacy",
    "$$host"
  ]);
  nt(n, [
    "label",
    "labelStyle",
    "style",
    "markerStart",
    "markerEnd",
    "interactionWidth",
    "sourceX",
    "sourceY",
    "targetX",
    "targetY"
  ]), de(t, !1);
  const r = re(), o = re(), i = re();
  let s = w(t, "label", 12, void 0), a = w(t, "labelStyle", 12, void 0), l = w(t, "style", 12, void 0), u = w(t, "markerStart", 12, void 0), c = w(t, "markerEnd", 12, void 0), f = w(t, "interactionWidth", 12, void 0), d = w(t, "sourceX", 12), g = w(t, "sourceY", 12), p = w(t, "targetX", 12), x = w(t, "targetY", 12);
  return he(
    () => (h(r), h(o), h(i), j(d()), j(g()), j(p()), j(x())),
    () => {
      ((C) => (U(r, C[0]), U(o, C[1]), U(i, C[2])))(Hs({
        sourceX: d(),
        sourceY: g(),
        targetX: p(),
        targetY: x()
      }));
    }
  ), gt(), He(), To(e, {
    get path() {
      return h(r);
    },
    get labelX() {
      return h(o);
    },
    get labelY() {
      return h(i);
    },
    get label() {
      return s();
    },
    get labelStyle() {
      return a();
    },
    get markerStart() {
      return u();
    },
    get markerEnd() {
      return c();
    },
    get interactionWidth() {
      return f();
    },
    get style() {
      return l();
    }
  }), fe({
    get label() {
      return s();
    },
    set label(C) {
      s(C), y();
    },
    get labelStyle() {
      return a();
    },
    set labelStyle(C) {
      a(C), y();
    },
    get style() {
      return l();
    },
    set style(C) {
      l(C), y();
    },
    get markerStart() {
      return u();
    },
    set markerStart(C) {
      u(C), y();
    },
    get markerEnd() {
      return c();
    },
    set markerEnd(C) {
      c(C), y();
    },
    get interactionWidth() {
      return f();
    },
    set interactionWidth(C) {
      f(C), y();
    },
    get sourceX() {
      return d();
    },
    set sourceX(C) {
      d(C), y();
    },
    get sourceY() {
      return g();
    },
    set sourceY(C) {
      g(C), y();
    },
    get targetX() {
      return p();
    },
    set targetX(C) {
      p(C), y();
    },
    get targetY() {
      return x();
    },
    set targetY(C) {
      x(C), y();
    }
  });
}
ae(
  $c,
  {
    label: {},
    labelStyle: {},
    style: {},
    markerStart: {},
    markerEnd: {},
    interactionWidth: {},
    sourceX: {},
    sourceY: {},
    targetX: {},
    targetY: {}
  },
  [],
  [],
  !0
);
function Ec(e, t) {
  const n = nt(t, [
    "children",
    "$$slots",
    "$$events",
    "$$legacy",
    "$$host"
  ]);
  nt(n, [
    "label",
    "labelStyle",
    "style",
    "markerStart",
    "markerEnd",
    "interactionWidth",
    "sourceX",
    "sourceY",
    "sourcePosition",
    "targetX",
    "targetY",
    "targetPosition"
  ]), de(t, !1);
  const r = re(), o = re(), i = re();
  let s = w(t, "label", 12, void 0), a = w(t, "labelStyle", 12, void 0), l = w(t, "style", 12, void 0), u = w(t, "markerStart", 12, void 0), c = w(t, "markerEnd", 12, void 0), f = w(t, "interactionWidth", 12, void 0), d = w(t, "sourceX", 12), g = w(t, "sourceY", 12), p = w(t, "sourcePosition", 12), x = w(t, "targetX", 12), C = w(t, "targetY", 12), $ = w(t, "targetPosition", 12);
  return he(
    () => (h(r), h(o), h(i), j(d()), j(g()), j(x()), j(C()), j(p()), j($())),
    () => {
      ((m) => (U(r, m[0]), U(o, m[1]), U(i, m[2])))(wi({
        sourceX: d(),
        sourceY: g(),
        targetX: x(),
        targetY: C(),
        sourcePosition: p(),
        targetPosition: $(),
        borderRadius: 0
      }));
    }
  ), gt(), He(), To(e, {
    get path() {
      return h(r);
    },
    get labelX() {
      return h(o);
    },
    get labelY() {
      return h(i);
    },
    get label() {
      return s();
    },
    get labelStyle() {
      return a();
    },
    get markerStart() {
      return u();
    },
    get markerEnd() {
      return c();
    },
    get interactionWidth() {
      return f();
    },
    get style() {
      return l();
    }
  }), fe({
    get label() {
      return s();
    },
    set label(m) {
      s(m), y();
    },
    get labelStyle() {
      return a();
    },
    set labelStyle(m) {
      a(m), y();
    },
    get style() {
      return l();
    },
    set style(m) {
      l(m), y();
    },
    get markerStart() {
      return u();
    },
    set markerStart(m) {
      u(m), y();
    },
    get markerEnd() {
      return c();
    },
    set markerEnd(m) {
      c(m), y();
    },
    get interactionWidth() {
      return f();
    },
    set interactionWidth(m) {
      f(m), y();
    },
    get sourceX() {
      return d();
    },
    set sourceX(m) {
      d(m), y();
    },
    get sourceY() {
      return g();
    },
    set sourceY(m) {
      g(m), y();
    },
    get sourcePosition() {
      return p();
    },
    set sourcePosition(m) {
      p(m), y();
    },
    get targetX() {
      return x();
    },
    set targetX(m) {
      x(m), y();
    },
    get targetY() {
      return C();
    },
    set targetY(m) {
      C(m), y();
    },
    get targetPosition() {
      return $();
    },
    set targetPosition(m) {
      $(m), y();
    }
  });
}
ae(
  Ec,
  {
    label: {},
    labelStyle: {},
    style: {},
    markerStart: {},
    markerEnd: {},
    interactionWidth: {},
    sourceX: {},
    sourceY: {},
    sourcePosition: {},
    targetX: {},
    targetY: {},
    targetPosition: {}
  },
  [],
  [],
  !0
);
function d2(e, t) {
  const n = e.set, r = t.set, o = q(e), i = q(t);
  let a = o.length === 0 && i.length > 0 ? i : o;
  e.set(a);
  const l = (u) => {
    const c = n(u);
    return a = c, r(a), c;
  };
  e.set = t.set = l, e.update = t.update = (u) => l(u(a));
}
function f2(e, t) {
  const n = e.set, r = t.set;
  let o = q(t);
  e.set(o);
  const i = (s) => {
    n(s), r(s), o = s;
  };
  e.set = t.set = i, e.update = t.update = (s) => i(s(o));
}
const g2 = (e, t, n) => {
  if (!n)
    return;
  const r = q(e), o = t.set, i = n.set;
  let s = n ? q(n) : { x: 0, y: 0, zoom: 1 };
  t.set(s), t.set = (a) => (o(a), i(a), s = a, a), n.set = (a) => (r == null || r.syncViewport(a), o(a), i(a), s = a, a), t.update = (a) => {
    t.set(a(s));
  }, n.update = (a) => {
    n.set(a(s));
  };
}, h2 = (e, t, n, r = [0, 0], o = vi) => {
  const { subscribe: i, set: s, update: a } = we([]);
  let l = e, u = {}, c = !0;
  const f = (x) => (lc(x, t, n, {
    elevateNodesOnSelect: c,
    nodeOrigin: r,
    nodeExtent: o,
    defaults: u,
    checkEquality: !1
  }), l = x, s(l), l), d = (x) => f(x(l)), g = (x) => {
    u = x;
  }, p = (x) => {
    c = x.elevateNodesOnSelect ?? c;
  };
  return f(l), {
    subscribe: i,
    set: f,
    update: d,
    setDefaultOptions: g,
    setOptions: p
  };
}, v2 = (e, t, n, r) => {
  const { subscribe: o, set: i, update: s } = we([]);
  let a = e, l = {};
  const u = (d) => {
    const g = l ? d.map((p) => ({ ...l, ...p })) : d;
    cc(t, n, g), a = g, i(a);
  }, c = (d) => u(d(a)), f = (d) => {
    l = d;
  };
  return u(a), {
    subscribe: o,
    set: u,
    update: c,
    setDefaultOptions: f
  };
}, Sc = {
  input: yc,
  output: wc,
  default: _i,
  group: _c
}, Pc = {
  straight: $c,
  smoothstep: kc,
  default: xi,
  step: Ec
}, p2 = ({ nodes: e = [], edges: t = [], width: n, height: r, fitView: o, nodeOrigin: i, nodeExtent: s }) => {
  const a = /* @__PURE__ */ new Map(), l = /* @__PURE__ */ new Map(), u = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map(), f = i ?? [0, 0], d = s ?? vi;
  lc(e, a, l, {
    nodeExtent: d,
    nodeOrigin: f,
    elevateNodesOnSelect: !1,
    checkEquality: !1
  }), cc(u, c, t);
  let g = { x: 0, y: 0, zoom: 1 };
  if (o && n && r) {
    const p = No(a, {
      filter: (x) => !!((x.width || x.initialWidth) && (x.height || x.initialHeight))
    });
    g = ua(p, n, r, 0.5, 2, 0.1);
  }
  return {
    flowId: we(null),
    nodes: h2(e, a, l, f, d),
    nodeLookup: Ft(a),
    parentLookup: Ft(l),
    edgeLookup: Ft(c),
    visibleNodes: Ft([]),
    edges: v2(t, u, c),
    visibleEdges: Ft([]),
    connectionLookup: Ft(u),
    height: we(500),
    width: we(500),
    minZoom: we(0.5),
    maxZoom: we(2),
    nodeOrigin: we(f),
    nodeDragThreshold: we(1),
    nodeExtent: we(d),
    translateExtent: we(vi),
    autoPanOnNodeDrag: we(!0),
    autoPanOnConnect: we(!0),
    fitViewOnInit: we(!1),
    fitViewOnInitDone: we(!1),
    fitViewOptions: we(void 0),
    panZoom: we(null),
    snapGrid: we(null),
    dragging: we(!1),
    selectionRect: we(null),
    selectionKeyPressed: we(!1),
    multiselectionKeyPressed: we(!1),
    deleteKeyPressed: we(!1),
    panActivationKeyPressed: we(!1),
    zoomActivationKeyPressed: we(!1),
    selectionRectMode: we(null),
    selectionMode: we(pi.Partial),
    nodeTypes: we(Sc),
    edgeTypes: we(Pc),
    viewport: we(g),
    connectionMode: we(cr.Strict),
    domNode: we(null),
    connection: Ft(Ns),
    connectionLineType: we(Cr.Bezier),
    connectionRadius: we(20),
    isValidConnection: we(() => !0),
    nodesDraggable: we(!0),
    nodesConnectable: we(!0),
    elementsSelectable: we(!0),
    selectNodesOnDrag: we(!0),
    markers: Ft([]),
    defaultMarkerColor: we("#b1b1b7"),
    lib: Ft("svelte"),
    onlyRenderVisibleElements: we(!1),
    onerror: we(v0),
    ondelete: we(void 0),
    onedgecreate: we(void 0),
    onconnect: we(void 0),
    onconnectstart: we(void 0),
    onconnectend: we(void 0),
    onbeforedelete: we(void 0),
    nodesInitialized: we(!1),
    edgesInitialized: we(!1),
    viewportInitialized: we(!1),
    initialized: Ft(!1)
  };
};
function m2(e) {
  const t = Kn([
    e.edges,
    e.nodes,
    e.nodeLookup,
    e.onlyRenderVisibleElements,
    e.viewport,
    e.width,
    e.height
  ], ([n, , r, o, i, s, a]) => o && s && a ? n.filter((u) => {
    const c = r.get(u.source), f = r.get(u.target);
    return c && f && b0({
      sourceNode: c,
      targetNode: f,
      width: s,
      height: a,
      transform: [i.x, i.y, i.zoom]
    });
  }) : n);
  return Kn([t, e.nodes, e.nodeLookup, e.connectionMode, e.onerror], ([n, , r, o, i]) => n.reduce((a, l) => {
    const u = r.get(l.source), c = r.get(l.target);
    if (!u || !c)
      return a;
    const f = N0({
      id: l.id,
      sourceNode: u,
      targetNode: c,
      sourceHandle: l.sourceHandle || null,
      targetHandle: l.targetHandle || null,
      connectionMode: o,
      onError: i
    });
    return f && a.push({
      ...l,
      zIndex: x0({
        selected: l.selected,
        zIndex: l.zIndex,
        sourceNode: u,
        targetNode: c,
        elevateOnSelect: !1
      }),
      ...f
    }), a;
  }, []));
}
function y2(e) {
  return Kn([
    e.nodeLookup,
    e.onlyRenderVisibleElements,
    e.width,
    e.height,
    e.viewport,
    e.nodes
  ], ([t, n, r, o, i]) => {
    const s = [i.x, i.y, i.zoom];
    return n ? Ju(t, { x: 0, y: 0, width: r, height: o }, s, !0) : Array.from(t.values());
  });
}
const Wi = Symbol();
function Nc({ nodes: e, edges: t, width: n, height: r, fitView: o, nodeOrigin: i, nodeExtent: s }) {
  const a = p2({
    nodes: e,
    edges: t,
    width: n,
    height: r,
    fitView: o,
    nodeOrigin: i,
    nodeExtent: s
  });
  function l(k) {
    a.nodeTypes.set({
      ...Sc,
      ...k
    });
  }
  function u(k) {
    a.edgeTypes.set({
      ...Pc,
      ...k
    });
  }
  function c(k) {
    const P = q(a.edges);
    a.edges.set($0(k, P));
  }
  const f = (k, P = !1) => {
    var I;
    const H = q(a.nodeLookup);
    for (const [B, F] of k) {
      const K = (I = H.get(B)) == null ? void 0 : I.internals.userNode;
      K && (K.position = F.position, K.dragging = P);
    }
    a.nodes.update((B) => B);
  };
  function d(k) {
    var F, K, ie;
    const P = q(a.nodeLookup), H = q(a.parentLookup), { changes: I, updatedInternals: B } = O0(k, P, q(a.parentLookup), q(a.domNode), q(a.nodeOrigin));
    if (B) {
      if (V0(P, H, { nodeOrigin: i, nodeExtent: s }), !q(a.fitViewOnInitDone) && q(a.fitViewOnInit)) {
        const ee = q(a.fitViewOptions), W = p({
          ...ee,
          nodes: ee == null ? void 0 : ee.nodes
        });
        a.fitViewOnInitDone.set(W);
      }
      for (const ee of I) {
        const W = (F = P.get(ee.id)) == null ? void 0 : F.internals.userNode;
        if (W)
          switch (ee.type) {
            case "dimensions": {
              const ue = { ...W.measured, ...ee.dimensions };
              ee.setAttributes && (W.width = ((K = ee.dimensions) == null ? void 0 : K.width) ?? W.width, W.height = ((ie = ee.dimensions) == null ? void 0 : ie.height) ?? W.height), W.measured = ue;
              break;
            }
            case "position":
              W.position = ee.position ?? W.position;
              break;
          }
      }
      a.nodes.update((ee) => ee), q(a.nodesInitialized) || a.nodesInitialized.set(!0);
    }
  }
  function g(k) {
    const P = q(a.panZoom), H = q(a.domNode);
    if (!P || !H)
      return Promise.resolve(!1);
    const { width: I, height: B } = ca(H), F = ul(q(a.nodeLookup), k);
    return cl({
      nodes: F,
      width: I,
      height: B,
      minZoom: q(a.minZoom),
      maxZoom: q(a.maxZoom),
      panZoom: P
    }, k);
  }
  function p(k) {
    const P = q(a.panZoom);
    if (!P)
      return !1;
    const H = ul(q(a.nodeLookup), k);
    return cl({
      nodes: H,
      width: q(a.width),
      height: q(a.height),
      minZoom: q(a.minZoom),
      maxZoom: q(a.maxZoom),
      panZoom: P
    }, k), H.size > 0;
  }
  function x(k, P) {
    const H = q(a.panZoom);
    return H ? H.scaleBy(k, P) : Promise.resolve(!1);
  }
  function C(k) {
    return x(1.2, k);
  }
  function $(k) {
    return x(1 / 1.2, k);
  }
  function m(k) {
    const P = q(a.panZoom);
    P && (P.setScaleExtent([k, q(a.maxZoom)]), a.minZoom.set(k));
  }
  function _(k) {
    const P = q(a.panZoom);
    P && (P.setScaleExtent([q(a.minZoom), k]), a.maxZoom.set(k));
  }
  function v(k) {
    const P = q(a.panZoom);
    P && (P.setTranslateExtent(k), a.translateExtent.set(k));
  }
  function b(k) {
    let P = !1;
    return k.forEach((H) => {
      H.selected && (H.selected = !1, P = !0);
    }), P;
  }
  function N(k) {
    var P;
    (P = q(a.panZoom)) == null || P.setClickDistance(k);
  }
  function E(k) {
    b((k == null ? void 0 : k.nodes) || q(a.nodes)) && a.nodes.set(q(a.nodes)), b((k == null ? void 0 : k.edges) || q(a.edges)) && a.edges.set(q(a.edges));
  }
  a.deleteKeyPressed.subscribe(async (k) => {
    var P;
    if (k) {
      const H = q(a.nodes), I = q(a.edges), B = H.filter((ee) => ee.selected), F = I.filter((ee) => ee.selected), { nodes: K, edges: ie } = await Qu({
        nodesToRemove: B,
        edgesToRemove: F,
        nodes: H,
        edges: I,
        onBeforeDelete: q(a.onbeforedelete)
      });
      (K.length || ie.length) && (a.nodes.update((ee) => ee.filter((W) => !K.some((ue) => ue.id === W.id))), a.edges.update((ee) => ee.filter((W) => !ie.some((ue) => ue.id === W.id))), (P = q(a.ondelete)) == null || P({
        nodes: K,
        edges: ie
      }));
    }
  });
  function M(k) {
    const P = q(a.multiselectionKeyPressed);
    a.nodes.update((H) => H.map((I) => {
      const B = k.includes(I.id), F = P && I.selected || B;
      return I.selected = F, I;
    })), P || a.edges.update((H) => H.map((I) => (I.selected = !1, I)));
  }
  function D(k) {
    const P = q(a.multiselectionKeyPressed);
    a.edges.update((H) => H.map((I) => {
      const B = k.includes(I.id), F = P && I.selected || B;
      return I.selected = F, I;
    })), P || a.nodes.update((H) => H.map((I) => (I.selected = !1, I)));
  }
  function V(k) {
    var H;
    const P = (H = q(a.nodes)) == null ? void 0 : H.find((I) => I.id === k);
    if (!P) {
      console.warn("012", Dr.error012(k));
      return;
    }
    a.selectionRect.set(null), a.selectionRectMode.set(null), P.selected ? P.selected && q(a.multiselectionKeyPressed) && E({ nodes: [P], edges: [] }) : M([k]);
  }
  function A(k) {
    const P = q(a.viewport);
    return I0({
      delta: k,
      panZoom: q(a.panZoom),
      transform: [P.x, P.y, P.zoom],
      translateExtent: q(a.translateExtent),
      width: q(a.width),
      height: q(a.height)
    });
  }
  const O = we(Ns), R = (k) => {
    O.set({ ...k });
  };
  function S() {
    O.set(Ns);
  }
  function T() {
    a.fitViewOnInitDone.set(!1), a.selectionRect.set(null), a.selectionRectMode.set(null), a.snapGrid.set(null), a.isValidConnection.set(() => !0), E(), S();
  }
  return {
    // state
    ...a,
    // derived state
    visibleEdges: m2(a),
    visibleNodes: y2(a),
    connection: Kn([O, a.viewport], ([k, P]) => k.inProgress ? {
      ...k,
      to: Mo(k.to, [P.x, P.y, P.zoom])
    } : { ...k }),
    markers: Kn([a.edges, a.defaultMarkerColor, a.flowId], ([k, P, H]) => M0(k, { defaultColor: P, id: H })),
    initialized: (() => {
      let k = !1;
      const P = q(a.nodes).length, H = q(a.edges).length;
      return Kn([a.nodesInitialized, a.edgesInitialized, a.viewportInitialized], ([I, B, F]) => k || (P === 0 ? k = F : H === 0 ? k = F && I : k = F && I && B, k));
    })(),
    // actions
    syncNodeStores: (k) => d2(a.nodes, k),
    syncEdgeStores: (k) => f2(a.edges, k),
    syncViewport: (k) => g2(a.panZoom, a.viewport, k),
    setNodeTypes: l,
    setEdgeTypes: u,
    addEdge: c,
    updateNodePositions: f,
    updateNodeInternals: d,
    zoomIn: C,
    zoomOut: $,
    fitView: (k) => g(k),
    setMinZoom: m,
    setMaxZoom: _,
    setTranslateExtent: v,
    setPaneClickDistance: N,
    unselectNodesAndEdges: E,
    addSelectedNodes: M,
    addSelectedEdges: D,
    handleNodeSelection: V,
    panBy: A,
    updateConnection: R,
    cancelConnection: S,
    reset: T
  };
}
function Ue() {
  const e = ar(Wi);
  if (!e)
    throw new Error("In order to use useStore you need to wrap your component in a <SvelteFlowProvider />");
  return e.getStore();
}
function w2({ nodes: e, edges: t, width: n, height: r, fitView: o, nodeOrigin: i, nodeExtent: s }) {
  const a = Nc({ nodes: e, edges: t, width: n, height: r, fitView: o, nodeOrigin: i, nodeExtent: s });
  return Tr(Wi, {
    getStore: () => a
  }), a;
}
function us(e, t) {
  const { panZoom: n, minZoom: r, maxZoom: o, initialViewport: i, viewport: s, dragging: a, translateExtent: l, paneClickDistance: u } = t, c = n2({
    domNode: e,
    minZoom: r,
    maxZoom: o,
    translateExtent: l,
    viewport: i,
    paneClickDistance: u,
    onDraggingChange: a.set
  }), f = c.getViewport();
  return s.set(f), n.set(c), c.update(t), {
    update(d) {
      c.update(d);
    }
  };
}
var _2 = /* @__PURE__ */ ne('<div class="svelte-flow__zoom svelte-4xkw84"><!></div>');
const x2 = {
  hash: "svelte-4xkw84",
  code: ".svelte-flow__zoom.svelte-4xkw84 {width:100%;height:100%;position:absolute;top:0;left:0;z-index:4;}"
};
function Mc(e, t) {
  de(t, !1), Je(e, x2);
  const [n, r] = tt(), o = () => Q(H, "$panActivationKeyPressed", n), i = () => Q(R, "$minZoom", n), s = () => Q(S, "$maxZoom", n), a = () => Q(I, "$zoomActivationKeyPressed", n), l = () => Q(O, "$selectionRect", n), u = () => Q(k, "$translateExtent", n), c = () => Q(P, "$lib", n), f = re(), d = re(), g = re();
  let p = w(t, "initialViewport", 12, void 0), x = w(t, "onMoveStart", 12, void 0), C = w(t, "onMove", 12, void 0), $ = w(t, "onMoveEnd", 12, void 0), m = w(t, "panOnScrollMode", 12), _ = w(t, "preventScrolling", 12), v = w(t, "zoomOnScroll", 12), b = w(t, "zoomOnDoubleClick", 12), N = w(t, "zoomOnPinch", 12), E = w(t, "panOnDrag", 12), M = w(t, "panOnScroll", 12), D = w(t, "paneClickDistance", 12);
  const {
    viewport: V,
    panZoom: A,
    selectionRect: O,
    minZoom: R,
    maxZoom: S,
    dragging: T,
    translateExtent: k,
    lib: P,
    panActivationKeyPressed: H,
    zoomActivationKeyPressed: I,
    viewportInitialized: B
  } = Ue(), F = (W) => V.set({
    x: W[0],
    y: W[1],
    zoom: W[2]
  });
  un(() => {
    li(B, !0);
  }), he(() => j(p()), () => {
    U(f, p() || { x: 0, y: 0, zoom: 1 });
  }), he(
    () => (o(), j(E())),
    () => {
      U(d, o() || E());
    }
  ), he(
    () => (o(), j(M())),
    () => {
      U(g, o() || M());
    }
  ), gt(), He();
  var K = _2(), ie = X(K);
  pt(ie, t, "default", {}), Z(K), vt(K, (W, ue) => us == null ? void 0 : us(W, ue), () => ({
    viewport: V,
    minZoom: i(),
    maxZoom: s(),
    initialViewport: h(f),
    dragging: T,
    panZoom: A,
    onPanZoomStart: x(),
    onPanZoom: C(),
    onPanZoomEnd: $(),
    zoomOnScroll: v(),
    zoomOnDoubleClick: b(),
    zoomOnPinch: N(),
    panOnScroll: h(g),
    panOnDrag: h(d),
    panOnScrollSpeed: 0.5,
    panOnScrollMode: m() || qn.Free,
    zoomActivationKeyPressed: a(),
    preventScrolling: typeof _() == "boolean" ? _() : !0,
    noPanClassName: "nopan",
    noWheelClassName: "nowheel",
    userSelectionActive: !!l(),
    translateExtent: u(),
    lib: c(),
    paneClickDistance: D(),
    onTransformChange: F
  })), L(e, K);
  var ee = fe({
    get initialViewport() {
      return p();
    },
    set initialViewport(W) {
      p(W), y();
    },
    get onMoveStart() {
      return x();
    },
    set onMoveStart(W) {
      x(W), y();
    },
    get onMove() {
      return C();
    },
    set onMove(W) {
      C(W), y();
    },
    get onMoveEnd() {
      return $();
    },
    set onMoveEnd(W) {
      $(W), y();
    },
    get panOnScrollMode() {
      return m();
    },
    set panOnScrollMode(W) {
      m(W), y();
    },
    get preventScrolling() {
      return _();
    },
    set preventScrolling(W) {
      _(W), y();
    },
    get zoomOnScroll() {
      return v();
    },
    set zoomOnScroll(W) {
      v(W), y();
    },
    get zoomOnDoubleClick() {
      return b();
    },
    set zoomOnDoubleClick(W) {
      b(W), y();
    },
    get zoomOnPinch() {
      return N();
    },
    set zoomOnPinch(W) {
      N(W), y();
    },
    get panOnDrag() {
      return E();
    },
    set panOnDrag(W) {
      E(W), y();
    },
    get panOnScroll() {
      return M();
    },
    set panOnScroll(W) {
      M(W), y();
    },
    get paneClickDistance() {
      return D();
    },
    set paneClickDistance(W) {
      D(W), y();
    }
  });
  return r(), ee;
}
ae(
  Mc,
  {
    initialViewport: {},
    onMoveStart: {},
    onMove: {},
    onMoveEnd: {},
    panOnScrollMode: {},
    preventScrolling: {},
    zoomOnScroll: {},
    zoomOnDoubleClick: {},
    zoomOnPinch: {},
    panOnDrag: {},
    panOnScroll: {},
    paneClickDistance: {}
  },
  ["default"],
  [],
  !0
);
function kl(e, t) {
  return (n) => {
    n.target === t && (e == null || e(n));
  };
}
function $l(e) {
  return (t) => {
    const n = e.includes(t.id);
    return t.selected !== n && (t.selected = n), t;
  };
}
var b2 = /* @__PURE__ */ ne("<div><!></div>");
const C2 = {
  hash: "svelte-1esy7hx",
  code: ".svelte-flow__pane.svelte-1esy7hx {position:absolute;top:0;left:0;width:100%;height:100%;}"
};
function Tc(e, t) {
  de(t, !1), Je(e, C2);
  const [n, r] = tt(), o = () => Q(S, "$panActivationKeyPressed", n), i = () => Q(O, "$selectionKeyPressed", n), s = () => Q(V, "$selectionRect", n), a = () => Q(D, "$elementsSelectable", n), l = () => Q(A, "$selectionRectMode", n), u = () => Q(N, "$edges", n), c = () => Q(b, "$nodeLookup", n), f = () => Q(E, "$viewport", n), d = () => Q(R, "$selectionMode", n), g = () => Q(M, "$dragging", n), p = re(), x = re(), C = re();
  let $ = w(t, "panOnDrag", 12, void 0), m = w(t, "selectionOnDrag", 12, void 0);
  const _ = Oi(), {
    nodes: v,
    nodeLookup: b,
    edges: N,
    viewport: E,
    dragging: M,
    elementsSelectable: D,
    selectionRect: V,
    selectionRectMode: A,
    selectionKeyPressed: O,
    selectionMode: R,
    panActivationKeyPressed: S,
    unselectNodesAndEdges: T
  } = Ue();
  let k = re(), P = null, H = [], I = !1;
  function B(G) {
    if (I) {
      I = !1;
      return;
    }
    _("paneclick", { event: G }), T(), A.set(null);
  }
  function F(G) {
    var Ae, Xe;
    if (P = h(k).getBoundingClientRect(), !D || !h(x) || G.button !== 0 || G.target !== h(k) || !P)
      return;
    (Xe = (Ae = G.target) == null ? void 0 : Ae.setPointerCapture) == null || Xe.call(Ae, G.pointerId);
    const { x: se, y: Te } = Hn(G, P);
    T(), V.set({
      width: 0,
      height: 0,
      startX: se,
      startY: Te,
      x: se,
      y: Te
    });
  }
  function K(G) {
    if (!h(x) || !P || !s())
      return;
    I = !0;
    const se = Hn(G, P), Te = s().startX ?? 0, Ae = s().startY ?? 0, Xe = {
      ...s(),
      x: se.x < Te ? se.x : Te,
      y: se.y < Ae ? se.y : Ae,
      width: Math.abs(se.x - Te),
      height: Math.abs(se.y - Ae)
    }, te = H.map((oe) => oe.id), Fe = Ms(H, u()).map((oe) => oe.id);
    H = Ju(
      c(),
      Xe,
      [
        f().x,
        f().y,
        f().zoom
      ],
      d() === pi.Partial,
      !0
    );
    const Le = Ms(H, u()).map((oe) => oe.id), Qe = H.map((oe) => oe.id);
    (te.length !== Qe.length || Qe.some((oe) => !te.includes(oe))) && v.update((oe) => oe.map($l(Qe))), (Fe.length !== Le.length || Le.some((oe) => !Fe.includes(oe))) && N.update((oe) => oe.map($l(Le))), A.set("user"), V.set(Xe);
  }
  function ie(G) {
    var se, Te;
    G.button === 0 && ((Te = (se = G.target) == null ? void 0 : se.releasePointerCapture) == null || Te.call(se, G.pointerId), !h(x) && l() === "user" && G.target === h(k) && (B == null || B(G)), V.set(null), H.length > 0 && li(A, "nodes"), i() && (I = !1));
  }
  const ee = (G) => {
    var se;
    if (Array.isArray(h(p)) && ((se = h(p)) != null && se.includes(2))) {
      G.preventDefault();
      return;
    }
    _("panecontextmenu", { event: G });
  };
  he(
    () => (o(), j($())),
    () => {
      U(p, o() || $());
    }
  ), he(
    () => (i(), s(), j(m()), h(p)),
    () => {
      U(x, i() || s() || m() && h(p) !== !0);
    }
  ), he(
    () => (a(), h(x), l()),
    () => {
      U(C, a() && (h(x) || l() === "user"));
    }
  ), gt(), He();
  var W = b2(), ue = /* @__PURE__ */ Me(() => h(C) ? void 0 : kl(B, h(k))), me = /* @__PURE__ */ Me(() => kl(ee, h(k)));
  let Ce;
  var ge = X(W);
  pt(ge, t, "default", {}), Z(W), An(W, (G) => U(k, G), () => h(k)), Ee(
    (G) => Ce = kt(W, 1, "svelte-flow__pane svelte-1esy7hx", null, Ce, {
      draggable: G,
      dragging: g(),
      selection: h(x)
    }),
    [
      () => $() === !0 || Array.isArray($()) && $().includes(0)
    ],
    pe
  ), Ye("click", W, function(...G) {
    var se;
    (se = h(ue)) == null || se.apply(this, G);
  }), Ye("pointerdown", W, function(...G) {
    var se;
    (se = h(C) ? F : void 0) == null || se.apply(this, G);
  }), Ye("pointermove", W, function(...G) {
    var se;
    (se = h(C) ? K : void 0) == null || se.apply(this, G);
  }), Ye("pointerup", W, function(...G) {
    var se;
    (se = h(C) ? ie : void 0) == null || se.apply(this, G);
  }), Ye("contextmenu", W, function(...G) {
    var se;
    (se = h(me)) == null || se.apply(this, G);
  }), L(e, W);
  var ze = fe({
    get panOnDrag() {
      return $();
    },
    set panOnDrag(G) {
      $(G), y();
    },
    get selectionOnDrag() {
      return m();
    },
    set selectionOnDrag(G) {
      m(G), y();
    }
  });
  return r(), ze;
}
ae(Tc, { panOnDrag: {}, selectionOnDrag: {} }, ["default"], [], !0);
var k2 = /* @__PURE__ */ ne('<div class="svelte-flow__viewport xyflow__viewport svelte-1floaup"><!></div>');
const $2 = {
  hash: "svelte-1floaup",
  code: ".svelte-flow__viewport.svelte-1floaup {width:100%;height:100%;position:absolute;top:0;left:0;}"
};
function Hc(e, t) {
  de(t, !1), Je(e, $2);
  const [n, r] = tt(), o = () => Q(i, "$viewport", n), { viewport: i } = Ue();
  He();
  var s = k2(), a = X(s);
  pt(a, t, "default", {}), Z(s), Ee(() => ce(s, "style", `transform: translate(${o().x ?? ""}px, ${o().y ?? ""}px) scale(${o().zoom ?? ""})`)), L(e, s), fe(), r();
}
ae(Hc, {}, ["default"], [], !0);
function $r(e, t) {
  const { store: n, onDrag: r, onDragStart: o, onDragStop: i, onNodeMouseDown: s } = t, a = B0({
    onDrag: r,
    onDragStart: o,
    onDragStop: i,
    onNodeMouseDown: s,
    getStoreItems: () => {
      const u = q(n.snapGrid), c = q(n.viewport);
      return {
        nodes: q(n.nodes),
        nodeLookup: q(n.nodeLookup),
        edges: q(n.edges),
        nodeExtent: q(n.nodeExtent),
        snapGrid: u || [0, 0],
        snapToGrid: !!u,
        nodeOrigin: q(n.nodeOrigin),
        multiSelectionActive: q(n.multiselectionKeyPressed),
        domNode: q(n.domNode),
        transform: [c.x, c.y, c.zoom],
        autoPanOnNodeDrag: q(n.autoPanOnNodeDrag),
        nodesDraggable: q(n.nodesDraggable),
        selectNodesOnDrag: q(n.selectNodesOnDrag),
        nodeDragThreshold: q(n.nodeDragThreshold),
        unselectNodesAndEdges: n.unselectNodesAndEdges,
        updateNodePositions: n.updateNodePositions,
        panBy: n.panBy
      };
    }
  });
  function l(u, c) {
    if (c.disabled) {
      a.destroy();
      return;
    }
    a.update({
      domNode: u,
      noDragClassName: c.noDragClass,
      handleSelector: c.handleSelector,
      nodeId: c.nodeId,
      isSelectable: c.isSelectable,
      nodeClickDistance: c.nodeClickDistance
    });
  }
  return l(e, t), {
    update(u) {
      l(e, u);
    },
    destroy() {
      a.destroy();
    }
  };
}
function E2({ width: e, height: t, initialWidth: n, initialHeight: r, measuredWidth: o, measuredHeight: i }) {
  if (o === void 0 && i === void 0) {
    const s = e ?? n, a = t ?? r;
    return {
      width: s ? `width:${s}px;` : "",
      height: a ? `height:${a}px;` : ""
    };
  }
  return {
    width: e ? `width:${e}px;` : "",
    height: t ? `height:${t}px;` : ""
  };
}
var S2 = /* @__PURE__ */ ne("<div><!></div>");
function Vc(e, t) {
  de(t, !1);
  const [n, r] = tt(), o = () => Q(me, "$nodeTypes", n), i = () => Q(se, "$elementsSelectable", n), s = () => Q(Te, "$nodesDraggable", n), a = () => Q(Fe, "$connectableStore", n), l = re(void 0, !0), u = re(void 0, !0), c = re(void 0, !0), f = re(void 0, !0);
  let d = w(t, "node", 13), g = w(t, "id", 13), p = w(t, "data", 29, () => ({})), x = w(t, "selected", 13, !1), C = w(t, "draggable", 13, void 0), $ = w(t, "selectable", 13, void 0), m = w(t, "connectable", 13, !0), _ = w(t, "deletable", 13, !0), v = w(t, "hidden", 13, !1), b = w(t, "dragging", 13, !1), N = w(t, "resizeObserver", 13, null), E = w(t, "style", 13, void 0), M = w(t, "type", 13, "default"), D = w(t, "isParent", 13, !1), V = w(t, "positionX", 13), A = w(t, "positionY", 13), O = w(t, "sourcePosition", 13, void 0), R = w(t, "targetPosition", 13, void 0), S = w(t, "zIndex", 13), T = w(t, "measuredWidth", 13, void 0), k = w(t, "measuredHeight", 13, void 0), P = w(t, "initialWidth", 13, void 0), H = w(t, "initialHeight", 13, void 0), I = w(t, "width", 13, void 0), B = w(t, "height", 13, void 0), F = w(t, "dragHandle", 13, void 0), K = w(t, "initialized", 13, !1), ie = w(t, "parentId", 13, void 0), ee = w(t, "nodeClickDistance", 13, void 0), W = w(t, "class", 13, "");
  const ue = Ue(), {
    nodeTypes: me,
    nodeDragThreshold: Ce,
    selectNodesOnDrag: ge,
    handleNodeSelection: ze,
    updateNodeInternals: G,
    elementsSelectable: se,
    nodesDraggable: Te
  } = ue;
  let Ae = re(void 0, !0), Xe = re(null, !0);
  const te = Oi(), Fe = we(m());
  let Le = re(void 0, !0), Qe = re(void 0, !0), oe = re(void 0, !0);
  Tr("svelteflow__node_id", g()), Tr("svelteflow__node_connectable", Fe), Qs(() => {
    var J;
    h(Xe) && ((J = N()) == null || J.unobserve(h(Xe)));
  });
  function ve(J) {
    $() && (!q(ge) || !C() || q(Ce) > 0) && ze(g()), te("nodeclick", { node: d().internals.userNode, event: J });
  }
  he(() => j(M()), () => {
    U(l, M() || "default");
  }), he(() => (o(), h(l)), () => {
    U(u, !!o()[h(l)]);
  }), he(
    () => (o(), h(l), _i),
    () => {
      U(c, o()[h(l)] || _i);
    }
  ), he(
    () => (h(u), j(M())),
    () => {
      h(u) || console.warn("003", Dr.error003(M()));
    }
  ), he(
    () => (j(I()), j(B()), j(P()), j(H()), j(T()), j(k())),
    () => {
      U(f, E2({
        width: I(),
        height: B(),
        initialWidth: P(),
        initialHeight: H(),
        measuredWidth: T(),
        measuredHeight: k()
      }));
    }
  ), he(() => j(m()), () => {
    Fe.set(!!m());
  }), he(
    () => (h(Le), h(l), h(Qe), j(O()), h(oe), j(R()), j(g()), h(Ae)),
    () => {
      (h(Le) && h(l) !== h(Le) || h(Qe) && O() !== h(Qe) || h(oe) && R() !== h(oe)) && requestAnimationFrame(() => G(/* @__PURE__ */ new Map([
        [
          g(),
          {
            id: g(),
            nodeElement: h(Ae),
            force: !0
          }
        ]
      ]))), U(Le, h(l)), U(Qe, O()), U(oe, R());
    }
  ), he(
    () => (j(N()), h(Ae), h(Xe), j(K())),
    () => {
      N() && (h(Ae) !== h(Xe) || !K()) && (h(Xe) && N().unobserve(h(Xe)), h(Ae) && N().observe(h(Ae)), U(Xe, h(Ae)));
    }
  ), gt(), He(!0);
  var xe = et(), Oe = be(xe);
  {
    var ct = (J) => {
      var Re = S2();
      let le;
      var fn = X(Re);
      const Ut = /* @__PURE__ */ pe(() => x() ?? !1), gn = /* @__PURE__ */ pe(() => $() ?? i() ?? !0), Ne = /* @__PURE__ */ pe(() => _() ?? !0), rt = /* @__PURE__ */ pe(() => C() ?? s() ?? !0);
      yu(fn, () => h(c), (ye, ot) => {
        ot(ye, {
          get data() {
            return p();
          },
          get id() {
            return g();
          },
          get selected() {
            return h(Ut);
          },
          get selectable() {
            return h(gn);
          },
          get deletable() {
            return h(Ne);
          },
          get sourcePosition() {
            return O();
          },
          get targetPosition() {
            return R();
          },
          get zIndex() {
            return S();
          },
          get dragging() {
            return b();
          },
          get draggable() {
            return h(rt);
          },
          get dragHandle() {
            return F();
          },
          get parentId() {
            return ie();
          },
          get type() {
            return h(l);
          },
          get isConnectable() {
            return a();
          },
          get positionAbsoluteX() {
            return V();
          },
          get positionAbsoluteY() {
            return A();
          },
          get width() {
            return I();
          },
          get height() {
            return B();
          }
        });
      }), Z(Re), vt(Re, (ye, ot) => $r == null ? void 0 : $r(ye, ot), () => ({
        nodeId: g(),
        isSelectable: $(),
        disabled: !1,
        handleSelector: F(),
        noDragClass: "nodrag",
        nodeClickDistance: ee(),
        onNodeMouseDown: ze,
        onDrag: (ye, ot, at, Xt) => {
          te("nodedrag", { event: ye, targetNode: at, nodes: Xt });
        },
        onDragStart: (ye, ot, at, Xt) => {
          te("nodedragstart", { event: ye, targetNode: at, nodes: Xt });
        },
        onDragStop: (ye, ot, at, Xt) => {
          te("nodedragstop", { event: ye, targetNode: at, nodes: Xt });
        },
        store: ue
      })), An(Re, (ye) => U(Ae, ye), () => h(Ae)), Ot(() => Ye("click", Re, ve)), Ot(() => Ye("mouseenter", Re, (ye) => te("nodemouseenter", { node: d(), event: ye }))), Ot(() => Ye("mouseleave", Re, (ye) => te("nodemouseleave", { node: d(), event: ye }))), Ot(() => Ye("mousemove", Re, (ye) => te("nodemousemove", { node: d(), event: ye }))), Ot(() => Ye("contextmenu", Re, (ye) => te("nodecontextmenu", { node: d(), event: ye }))), Ee(
        (ye) => {
          ce(Re, "data-id", g()), le = kt(Re, 1, bn(ye), null, le, {
            dragging: b(),
            selected: x(),
            draggable: C(),
            connectable: m(),
            selectable: $(),
            nopan: C(),
            parent: D()
          }), ce(Re, "style", `${E() ?? ""};${h(f).width ?? ""}${h(f).height ?? ""}`), st(Re, "z-index", S()), st(Re, "transform", `translate(${V() ?? ""}px, ${A() ?? ""}px)`), st(Re, "visibility", K() ? "visible" : "hidden");
        },
        [
          () => Et([
            "svelte-flow__node",
            `svelte-flow__node-${h(l)}`,
            W()
          ])
        ],
        pe
      ), L(J, Re);
    };
    ke(Oe, (J) => {
      v() || J(ct);
    });
  }
  L(e, xe);
  var lt = fe({
    get node() {
      return d();
    },
    set node(J) {
      d(J), y();
    },
    get id() {
      return g();
    },
    set id(J) {
      g(J), y();
    },
    get data() {
      return p();
    },
    set data(J) {
      p(J), y();
    },
    get selected() {
      return x();
    },
    set selected(J) {
      x(J), y();
    },
    get draggable() {
      return C();
    },
    set draggable(J) {
      C(J), y();
    },
    get selectable() {
      return $();
    },
    set selectable(J) {
      $(J), y();
    },
    get connectable() {
      return m();
    },
    set connectable(J) {
      m(J), y();
    },
    get deletable() {
      return _();
    },
    set deletable(J) {
      _(J), y();
    },
    get hidden() {
      return v();
    },
    set hidden(J) {
      v(J), y();
    },
    get dragging() {
      return b();
    },
    set dragging(J) {
      b(J), y();
    },
    get resizeObserver() {
      return N();
    },
    set resizeObserver(J) {
      N(J), y();
    },
    get style() {
      return E();
    },
    set style(J) {
      E(J), y();
    },
    get type() {
      return M();
    },
    set type(J) {
      M(J), y();
    },
    get isParent() {
      return D();
    },
    set isParent(J) {
      D(J), y();
    },
    get positionX() {
      return V();
    },
    set positionX(J) {
      V(J), y();
    },
    get positionY() {
      return A();
    },
    set positionY(J) {
      A(J), y();
    },
    get sourcePosition() {
      return O();
    },
    set sourcePosition(J) {
      O(J), y();
    },
    get targetPosition() {
      return R();
    },
    set targetPosition(J) {
      R(J), y();
    },
    get zIndex() {
      return S();
    },
    set zIndex(J) {
      S(J), y();
    },
    get measuredWidth() {
      return T();
    },
    set measuredWidth(J) {
      T(J), y();
    },
    get measuredHeight() {
      return k();
    },
    set measuredHeight(J) {
      k(J), y();
    },
    get initialWidth() {
      return P();
    },
    set initialWidth(J) {
      P(J), y();
    },
    get initialHeight() {
      return H();
    },
    set initialHeight(J) {
      H(J), y();
    },
    get width() {
      return I();
    },
    set width(J) {
      I(J), y();
    },
    get height() {
      return B();
    },
    set height(J) {
      B(J), y();
    },
    get dragHandle() {
      return F();
    },
    set dragHandle(J) {
      F(J), y();
    },
    get initialized() {
      return K();
    },
    set initialized(J) {
      K(J), y();
    },
    get parentId() {
      return ie();
    },
    set parentId(J) {
      ie(J), y();
    },
    get nodeClickDistance() {
      return ee();
    },
    set nodeClickDistance(J) {
      ee(J), y();
    },
    get class() {
      return W();
    },
    set class(J) {
      W(J), y();
    }
  });
  return r(), lt;
}
ae(
  Vc,
  {
    node: {},
    id: {},
    data: {},
    selected: {},
    draggable: {},
    selectable: {},
    connectable: {},
    deletable: {},
    hidden: {},
    dragging: {},
    resizeObserver: {},
    style: {},
    type: {},
    isParent: {},
    positionX: {},
    positionY: {},
    sourcePosition: {},
    targetPosition: {},
    zIndex: {},
    measuredWidth: {},
    measuredHeight: {},
    initialWidth: {},
    initialHeight: {},
    width: {},
    height: {},
    dragHandle: {},
    initialized: {},
    parentId: {},
    nodeClickDistance: {},
    class: {}
  },
  [],
  [],
  !0
);
var P2 = /* @__PURE__ */ ne('<div class="svelte-flow__nodes svelte-tf4uy4"></div>');
const N2 = {
  hash: "svelte-tf4uy4",
  code: ".svelte-flow__nodes.svelte-tf4uy4 {width:100%;height:100%;position:absolute;left:0;top:0;}"
};
function Dc(e, t) {
  de(t, !1), Je(e, N2);
  const [n, r] = tt(), o = () => Q(c, "$visibleNodes", n), i = () => Q(f, "$nodesDraggable", n), s = () => Q(g, "$elementsSelectable", n), a = () => Q(d, "$nodesConnectable", n), l = () => Q(x, "$parentLookup", n);
  let u = w(t, "nodeClickDistance", 12, 0);
  const {
    visibleNodes: c,
    nodesDraggable: f,
    nodesConnectable: d,
    elementsSelectable: g,
    updateNodeInternals: p,
    parentLookup: x
  } = Ue(), C = typeof ResizeObserver > "u" ? null : new ResizeObserver((_) => {
    const v = /* @__PURE__ */ new Map();
    _.forEach((b) => {
      const N = b.target.getAttribute("data-id");
      v.set(N, { id: N, nodeElement: b.target, force: !0 });
    }), p(v);
  });
  Qs(() => {
    C == null || C.disconnect();
  }), He();
  var $ = P2();
  Yt($, 5, o, (_) => _.id, (_, v) => {
    const b = /* @__PURE__ */ pe(() => !!h(v).selected), N = /* @__PURE__ */ pe(() => !!h(v).hidden), E = /* @__PURE__ */ pe(() => !!(h(v).draggable || i() && typeof h(v).draggable > "u")), M = /* @__PURE__ */ pe(() => !!(h(v).selectable || s() && typeof h(v).selectable > "u")), D = /* @__PURE__ */ pe(() => !!(h(v).connectable || a() && typeof h(v).connectable > "u")), V = /* @__PURE__ */ pe(() => h(v).deletable ?? !0), A = /* @__PURE__ */ pe(() => l().has(h(v).id)), O = /* @__PURE__ */ pe(() => h(v).type ?? "default"), R = /* @__PURE__ */ pe(() => h(v).internals.z ?? 0), S = /* @__PURE__ */ pe(() => oc(h(v)));
    Vc(_, {
      get node() {
        return h(v);
      },
      get id() {
        return h(v).id;
      },
      get data() {
        return h(v).data;
      },
      get selected() {
        return h(b);
      },
      get hidden() {
        return h(N);
      },
      get draggable() {
        return h(E);
      },
      get selectable() {
        return h(M);
      },
      get connectable() {
        return h(D);
      },
      get deletable() {
        return h(V);
      },
      get positionX() {
        return h(v).internals.positionAbsolute.x;
      },
      get positionY() {
        return h(v).internals.positionAbsolute.y;
      },
      get isParent() {
        return h(A);
      },
      get style() {
        return h(v).style;
      },
      get class() {
        return h(v).class;
      },
      get type() {
        return h(O);
      },
      get sourcePosition() {
        return h(v).sourcePosition;
      },
      get targetPosition() {
        return h(v).targetPosition;
      },
      get dragging() {
        return h(v).dragging;
      },
      get zIndex() {
        return h(R);
      },
      get dragHandle() {
        return h(v).dragHandle;
      },
      get initialized() {
        return h(S);
      },
      get width() {
        return h(v).width;
      },
      get height() {
        return h(v).height;
      },
      get initialWidth() {
        return h(v).initialWidth;
      },
      get initialHeight() {
        return h(v).initialHeight;
      },
      get measuredWidth() {
        return h(v).measured.width;
      },
      get measuredHeight() {
        return h(v).measured.height;
      },
      get parentId() {
        return h(v).parentId;
      },
      resizeObserver: C,
      get nodeClickDistance() {
        return u();
      },
      $$events: {
        nodeclick(T) {
          Ve.call(this, t, T);
        },
        nodemouseenter(T) {
          Ve.call(this, t, T);
        },
        nodemousemove(T) {
          Ve.call(this, t, T);
        },
        nodemouseleave(T) {
          Ve.call(this, t, T);
        },
        nodedrag(T) {
          Ve.call(this, t, T);
        },
        nodedragstart(T) {
          Ve.call(this, t, T);
        },
        nodedragstop(T) {
          Ve.call(this, t, T);
        },
        nodecontextmenu(T) {
          Ve.call(this, t, T);
        }
      }
    });
  }), Z($), L(e, $);
  var m = fe({
    get nodeClickDistance() {
      return u();
    },
    set nodeClickDistance(_) {
      u(_), y();
    }
  });
  return r(), m;
}
ae(Dc, { nodeClickDistance: {} }, [], [], !0);
var M2 = /* @__PURE__ */ _e('<svg><g role="img"><!></g></svg>');
function Ac(e, t) {
  de(t, !1);
  const [n, r] = tt(), o = () => Q(W, "$edgeTypes", n), i = () => Q(ue, "$flowId", n), s = () => Q(me, "$elementsSelectable", n), a = () => Q(ee, "$edgeLookup", n), l = re(void 0, !0), u = re(void 0, !0), c = re(void 0, !0), f = re(void 0, !0), d = re(void 0, !0);
  let g = w(t, "id", 13), p = w(t, "type", 13, "default"), x = w(t, "source", 13, ""), C = w(t, "target", 13, ""), $ = w(t, "data", 29, () => ({})), m = w(t, "style", 13, void 0), _ = w(t, "zIndex", 13, void 0), v = w(t, "animated", 13, !1), b = w(t, "selected", 13, !1), N = w(t, "selectable", 13, void 0), E = w(t, "deletable", 13, void 0), M = w(t, "hidden", 13, !1), D = w(t, "label", 13, void 0), V = w(t, "labelStyle", 13, void 0), A = w(t, "markerStart", 13, void 0), O = w(t, "markerEnd", 13, void 0), R = w(t, "sourceHandle", 13, void 0), S = w(t, "targetHandle", 13, void 0), T = w(t, "sourceX", 13), k = w(t, "sourceY", 13), P = w(t, "targetX", 13), H = w(t, "targetY", 13), I = w(t, "sourcePosition", 13), B = w(t, "targetPosition", 13), F = w(t, "ariaLabel", 13, void 0), K = w(t, "interactionWidth", 13, void 0), ie = w(t, "class", 13, "");
  Tr("svelteflow__edge_id", g());
  const {
    edgeLookup: ee,
    edgeTypes: W,
    flowId: ue,
    elementsSelectable: me
  } = Ue(), Ce = Oi(), ge = bc();
  function ze(te) {
    const Fe = a().get(g());
    Fe && (ge(g()), Ce("edgeclick", { event: te, edge: Fe }));
  }
  function G(te, Fe) {
    const Le = a().get(g());
    Le && Ce(Fe, { event: te, edge: Le });
  }
  he(() => j(p()), () => {
    U(l, p() || "default");
  }), he(
    () => (o(), h(l), xi),
    () => {
      U(u, o()[h(l)] || xi);
    }
  ), he(
    () => (j(A()), i()),
    () => {
      U(c, A() ? `url('#${Vs(A(), i())}')` : void 0);
    }
  ), he(
    () => (j(O()), i()),
    () => {
      U(f, O() ? `url('#${Vs(O(), i())}')` : void 0);
    }
  ), he(
    () => (j(N()), s()),
    () => {
      U(d, N() ?? s());
    }
  ), gt(), He(!0);
  var se = et(), Te = be(se);
  {
    var Ae = (te) => {
      var Fe = M2(), Le = X(Fe);
      let Qe;
      var oe = X(Le);
      const ve = /* @__PURE__ */ pe(() => E() ?? !0);
      yu(oe, () => h(u), (xe, Oe) => {
        Oe(xe, {
          get id() {
            return g();
          },
          get source() {
            return x();
          },
          get target() {
            return C();
          },
          get sourceX() {
            return T();
          },
          get sourceY() {
            return k();
          },
          get targetX() {
            return P();
          },
          get targetY() {
            return H();
          },
          get sourcePosition() {
            return I();
          },
          get targetPosition() {
            return B();
          },
          get animated() {
            return v();
          },
          get selected() {
            return b();
          },
          get label() {
            return D();
          },
          get labelStyle() {
            return V();
          },
          get data() {
            return $();
          },
          get style() {
            return m();
          },
          get interactionWidth() {
            return K();
          },
          get selectable() {
            return h(d);
          },
          get deletable() {
            return h(ve);
          },
          get type() {
            return h(l);
          },
          get sourceHandleId() {
            return R();
          },
          get targetHandleId() {
            return S();
          },
          get markerStart() {
            return h(c);
          },
          get markerEnd() {
            return h(f);
          }
        });
      }), Z(Le), Z(Fe), Ee(
        (xe) => {
          st(Fe, "z-index", _()), Qe = kt(Le, 0, bn(xe), null, Qe, {
            animated: v(),
            selected: b(),
            selectable: h(d)
          }), ce(Le, "data-id", g()), ce(Le, "aria-label", F() === null ? void 0 : F() ? F() : `Edge from ${x()} to ${C()}`);
        },
        [
          () => Et(["svelte-flow__edge", ie()])
        ],
        pe
      ), Ye("click", Le, ze), Ye("contextmenu", Le, (xe) => {
        G(xe, "edgecontextmenu");
      }), Ye("mouseenter", Le, (xe) => {
        G(xe, "edgemouseenter");
      }), Ye("mouseleave", Le, (xe) => {
        G(xe, "edgemouseleave");
      }), L(te, Fe);
    };
    ke(Te, (te) => {
      M() || te(Ae);
    });
  }
  L(e, se);
  var Xe = fe({
    get id() {
      return g();
    },
    set id(te) {
      g(te), y();
    },
    get type() {
      return p();
    },
    set type(te) {
      p(te), y();
    },
    get source() {
      return x();
    },
    set source(te) {
      x(te), y();
    },
    get target() {
      return C();
    },
    set target(te) {
      C(te), y();
    },
    get data() {
      return $();
    },
    set data(te) {
      $(te), y();
    },
    get style() {
      return m();
    },
    set style(te) {
      m(te), y();
    },
    get zIndex() {
      return _();
    },
    set zIndex(te) {
      _(te), y();
    },
    get animated() {
      return v();
    },
    set animated(te) {
      v(te), y();
    },
    get selected() {
      return b();
    },
    set selected(te) {
      b(te), y();
    },
    get selectable() {
      return N();
    },
    set selectable(te) {
      N(te), y();
    },
    get deletable() {
      return E();
    },
    set deletable(te) {
      E(te), y();
    },
    get hidden() {
      return M();
    },
    set hidden(te) {
      M(te), y();
    },
    get label() {
      return D();
    },
    set label(te) {
      D(te), y();
    },
    get labelStyle() {
      return V();
    },
    set labelStyle(te) {
      V(te), y();
    },
    get markerStart() {
      return A();
    },
    set markerStart(te) {
      A(te), y();
    },
    get markerEnd() {
      return O();
    },
    set markerEnd(te) {
      O(te), y();
    },
    get sourceHandle() {
      return R();
    },
    set sourceHandle(te) {
      R(te), y();
    },
    get targetHandle() {
      return S();
    },
    set targetHandle(te) {
      S(te), y();
    },
    get sourceX() {
      return T();
    },
    set sourceX(te) {
      T(te), y();
    },
    get sourceY() {
      return k();
    },
    set sourceY(te) {
      k(te), y();
    },
    get targetX() {
      return P();
    },
    set targetX(te) {
      P(te), y();
    },
    get targetY() {
      return H();
    },
    set targetY(te) {
      H(te), y();
    },
    get sourcePosition() {
      return I();
    },
    set sourcePosition(te) {
      I(te), y();
    },
    get targetPosition() {
      return B();
    },
    set targetPosition(te) {
      B(te), y();
    },
    get ariaLabel() {
      return F();
    },
    set ariaLabel(te) {
      F(te), y();
    },
    get interactionWidth() {
      return K();
    },
    set interactionWidth(te) {
      K(te), y();
    },
    get class() {
      return ie();
    },
    set class(te) {
      ie(te), y();
    }
  });
  return r(), Xe;
}
ae(
  Ac,
  {
    id: {},
    type: {},
    source: {},
    target: {},
    data: {},
    style: {},
    zIndex: {},
    animated: {},
    selected: {},
    selectable: {},
    deletable: {},
    hidden: {},
    label: {},
    labelStyle: {},
    markerStart: {},
    markerEnd: {},
    sourceHandle: {},
    targetHandle: {},
    sourceX: {},
    sourceY: {},
    targetX: {},
    targetY: {},
    sourcePosition: {},
    targetPosition: {},
    ariaLabel: {},
    interactionWidth: {},
    class: {}
  },
  [],
  [],
  !0
);
function Lc(e, t) {
  de(t, !1);
  let n = w(t, "onMount", 12, void 0), r = w(t, "onDestroy", 12, void 0);
  return un(() => {
    var o;
    return (o = n()) == null || o(), r();
  }), He(), fe({
    get onMount() {
      return n();
    },
    set onMount(o) {
      n(o), y();
    },
    get onDestroy() {
      return r();
    },
    set onDestroy(o) {
      r(o), y();
    }
  });
}
ae(Lc, { onMount: {}, onDestroy: {} }, [], [], !0);
var T2 = /* @__PURE__ */ _e("<defs></defs>");
function Oc(e, t) {
  de(t, !1);
  const [n, r] = tt(), o = () => Q(i, "$markers", n), { markers: i } = Ue();
  He();
  var s = T2();
  Yt(s, 5, o, (a) => a.id, (a, l) => {
    Ic(a, ut(() => h(l)));
  }), Z(s), L(e, s), fe(), r();
}
ae(Oc, {}, [], [], !0);
var H2 = /* @__PURE__ */ _e('<polyline stroke-linecap="round" stroke-linejoin="round" fill="none" points="-5,-4 0,0 -5,4"></polyline>'), V2 = /* @__PURE__ */ _e('<polyline stroke-linecap="round" stroke-linejoin="round" points="-5,-4 0,0 -5,4 -5,-4"></polyline>'), D2 = /* @__PURE__ */ _e('<marker class="svelte-flow__arrowhead" viewBox="-10 -10 20 20" refX="0" refY="0"><!></marker>');
function Ic(e, t) {
  de(t, !1);
  let n = w(t, "id", 12), r = w(t, "type", 12), o = w(t, "width", 12, 12.5), i = w(t, "height", 12, 12.5), s = w(t, "markerUnits", 12, "strokeWidth"), a = w(t, "orient", 12, "auto-start-reverse"), l = w(t, "color", 12, void 0), u = w(t, "strokeWidth", 12, void 0);
  He();
  var c = D2(), f = X(c);
  {
    var d = (p) => {
      var x = H2();
      Ee(() => {
        ce(x, "stroke", l()), ce(x, "stroke-width", u());
      }), L(p, x);
    }, g = (p, x) => {
      {
        var C = ($) => {
          var m = V2();
          Ee(() => {
            ce(m, "stroke", l()), ce(m, "stroke-width", u()), ce(m, "fill", l());
          }), L($, m);
        };
        ke(
          p,
          ($) => {
            r() === mo.ArrowClosed && $(C);
          },
          x
        );
      }
    };
    ke(f, (p) => {
      r() === mo.Arrow ? p(d) : p(g, !1);
    });
  }
  return Z(c), Ee(() => {
    ce(c, "id", n()), ce(c, "markerWidth", `${o()}`), ce(c, "markerHeight", `${i()}`), ce(c, "markerUnits", s()), ce(c, "orient", a());
  }), L(e, c), fe({
    get id() {
      return n();
    },
    set id(p) {
      n(p), y();
    },
    get type() {
      return r();
    },
    set type(p) {
      r(p), y();
    },
    get width() {
      return o();
    },
    set width(p) {
      o(p), y();
    },
    get height() {
      return i();
    },
    set height(p) {
      i(p), y();
    },
    get markerUnits() {
      return s();
    },
    set markerUnits(p) {
      s(p), y();
    },
    get orient() {
      return a();
    },
    set orient(p) {
      a(p), y();
    },
    get color() {
      return l();
    },
    set color(p) {
      l(p), y();
    },
    get strokeWidth() {
      return u();
    },
    set strokeWidth(p) {
      u(p), y();
    }
  });
}
ae(
  Ic,
  {
    id: {},
    type: {},
    width: {},
    height: {},
    markerUnits: {},
    orient: {},
    color: {},
    strokeWidth: {}
  },
  [],
  [],
  !0
);
var A2 = /* @__PURE__ */ ne('<div class="svelte-flow__edges"><svg class="svelte-flow__marker"><!></svg> <!> <!></div>');
function zc(e, t) {
  de(t, !1);
  const [n, r] = tt(), o = () => Q(a, "$visibleEdges", n), i = () => Q(c, "$elementsSelectable", n);
  let s = w(t, "defaultEdgeOptions", 12);
  const {
    visibleEdges: a,
    edgesInitialized: l,
    edges: { setDefaultOptions: u },
    elementsSelectable: c
  } = Ue();
  un(() => {
    s() && u(s());
  }), He();
  var f = A2(), d = X(f), g = X(d);
  Oc(g, {}), Z(d);
  var p = z(d, 2);
  Yt(p, 1, o, (m) => m.id, (m, _) => {
    const v = /* @__PURE__ */ pe(() => h(_).selectable ?? i()), b = /* @__PURE__ */ pe(() => h(_).type || "default");
    Ac(m, {
      get id() {
        return h(_).id;
      },
      get source() {
        return h(_).source;
      },
      get target() {
        return h(_).target;
      },
      get data() {
        return h(_).data;
      },
      get style() {
        return h(_).style;
      },
      get animated() {
        return h(_).animated;
      },
      get selected() {
        return h(_).selected;
      },
      get selectable() {
        return h(v);
      },
      get deletable() {
        return h(_).deletable;
      },
      get hidden() {
        return h(_).hidden;
      },
      get label() {
        return h(_).label;
      },
      get labelStyle() {
        return h(_).labelStyle;
      },
      get markerStart() {
        return h(_).markerStart;
      },
      get markerEnd() {
        return h(_).markerEnd;
      },
      get sourceHandle() {
        return h(_).sourceHandle;
      },
      get targetHandle() {
        return h(_).targetHandle;
      },
      get sourceX() {
        return h(_).sourceX;
      },
      get sourceY() {
        return h(_).sourceY;
      },
      get targetX() {
        return h(_).targetX;
      },
      get targetY() {
        return h(_).targetY;
      },
      get sourcePosition() {
        return h(_).sourcePosition;
      },
      get targetPosition() {
        return h(_).targetPosition;
      },
      get ariaLabel() {
        return h(_).ariaLabel;
      },
      get interactionWidth() {
        return h(_).interactionWidth;
      },
      get class() {
        return h(_).class;
      },
      get type() {
        return h(b);
      },
      get zIndex() {
        return h(_).zIndex;
      },
      $$events: {
        edgeclick(N) {
          Ve.call(this, t, N);
        },
        edgecontextmenu(N) {
          Ve.call(this, t, N);
        },
        edgemouseenter(N) {
          Ve.call(this, t, N);
        },
        edgemouseleave(N) {
          Ve.call(this, t, N);
        }
      }
    });
  });
  var x = z(p, 2);
  {
    var C = (m) => {
      Lc(m, {
        onMount: () => {
          li(l, !0);
        },
        onDestroy: () => {
          li(l, !1);
        }
      });
    };
    ke(x, (m) => {
      o().length > 0 && m(C);
    });
  }
  Z(f), L(e, f);
  var $ = fe({
    get defaultEdgeOptions() {
      return s();
    },
    set defaultEdgeOptions(m) {
      s(m), y();
    }
  });
  return r(), $;
}
ae(zc, { defaultEdgeOptions: {} }, [], [], !0);
var L2 = /* @__PURE__ */ ne('<div class="svelte-flow__selection svelte-1iugwpu"></div>');
const O2 = {
  hash: "svelte-1iugwpu",
  code: ".svelte-flow__selection.svelte-1iugwpu {position:absolute;top:0;left:0;}"
};
function ha(e, t) {
  de(t, !1), Je(e, O2);
  let n = w(t, "x", 12, 0), r = w(t, "y", 12, 0), o = w(t, "width", 12, 0), i = w(t, "height", 12, 0), s = w(t, "isVisible", 12, !0);
  var a = et(), l = be(a);
  {
    var u = (c) => {
      var f = L2();
      Ee(() => {
        st(f, "width", typeof o() == "string" ? o() : `${o()}px`), st(f, "height", typeof i() == "string" ? i() : `${i()}px`), st(f, "transform", `translate(${n()}px, ${r()}px)`);
      }), L(c, f);
    };
    ke(l, (c) => {
      s() && c(u);
    });
  }
  return L(e, a), fe({
    get x() {
      return n();
    },
    set x(c) {
      n(c), y();
    },
    get y() {
      return r();
    },
    set y(c) {
      r(c), y();
    },
    get width() {
      return o();
    },
    set width(c) {
      o(c), y();
    },
    get height() {
      return i();
    },
    set height(c) {
      i(c), y();
    },
    get isVisible() {
      return s();
    },
    set isVisible(c) {
      s(c), y();
    }
  });
}
ae(
  ha,
  {
    x: {},
    y: {},
    width: {},
    height: {},
    isVisible: {}
  },
  [],
  [],
  !0
);
function Rc(e, t) {
  de(t, !1);
  const [n, r] = tt(), o = () => Q(s, "$selectionRect", n), i = () => Q(a, "$selectionRectMode", n), { selectionRect: s, selectionRectMode: a } = Ue();
  He();
  const l = /* @__PURE__ */ pe(() => !!(o() && i() === "user")), u = /* @__PURE__ */ pe(() => {
    var g;
    return (g = o()) == null ? void 0 : g.width;
  }), c = /* @__PURE__ */ pe(() => {
    var g;
    return (g = o()) == null ? void 0 : g.height;
  }), f = /* @__PURE__ */ pe(() => {
    var g;
    return (g = o()) == null ? void 0 : g.x;
  }), d = /* @__PURE__ */ pe(() => {
    var g;
    return (g = o()) == null ? void 0 : g.y;
  });
  ha(e, {
    get isVisible() {
      return h(l);
    },
    get width() {
      return h(u);
    },
    get height() {
      return h(c);
    },
    get x() {
      return h(f);
    },
    get y() {
      return h(d);
    }
  }), fe(), r();
}
ae(Rc, {}, [], [], !0);
var I2 = /* @__PURE__ */ ne('<div class="selection-wrapper nopan svelte-5pxri" role="button" tabindex="-1"><!></div>');
const z2 = {
  hash: "svelte-5pxri",
  code: ".selection-wrapper.svelte-5pxri {position:absolute;top:0;left:0;z-index:7;pointer-events:all;}"
};
function Bc(e, t) {
  de(t, !1), Je(e, z2);
  const [n, r] = tt(), o = () => Q(l, "$selectionRectMode", n), i = () => Q(c, "$nodeLookup", n), s = () => Q(u, "$nodes", n), a = Ue(), { selectionRectMode: l, nodes: u, nodeLookup: c } = a, f = Oi();
  let d = re(null);
  function g(m) {
    const _ = s().filter((v) => v.selected);
    f("selectioncontextmenu", { nodes: _, event: m });
  }
  function p(m) {
    const _ = s().filter((v) => v.selected);
    f("selectionclick", { nodes: _, event: m });
  }
  he(
    () => (o(), i(), s()),
    () => {
      o() === "nodes" && (U(d, No(i(), { filter: (m) => !!m.selected })), s());
    }
  ), gt(), He();
  var x = et(), C = be(x);
  {
    var $ = (m) => {
      var _ = I2(), v = X(_);
      ha(v, { width: "100%", height: "100%", x: 0, y: 0 }), Z(_), vt(_, (b, N) => $r == null ? void 0 : $r(b, N), () => ({
        disabled: !1,
        store: a,
        onDrag: (b, N, E, M) => {
          f("nodedrag", { event: b, targetNode: null, nodes: M });
        },
        onDragStart: (b, N, E, M) => {
          f("nodedragstart", { event: b, targetNode: null, nodes: M });
        },
        onDragStop: (b, N, E, M) => {
          f("nodedragstop", { event: b, targetNode: null, nodes: M });
        }
      })), Ot(() => Ye("contextmenu", _, g)), Ot(() => Ye("click", _, p)), Ot(() => Ye("keyup", _, () => {
      })), Ee(() => ce(_, "style", `width: ${h(d).width ?? ""}px; height: ${h(d).height ?? ""}px; transform: translate(${h(d).x ?? ""}px, ${h(d).y ?? ""}px)`)), L(m, _);
    };
    ke(C, (m) => {
      o() === "nodes" && h(d) && Nn(h(d).x) && Nn(h(d).y) && m($);
    });
  }
  L(e, x), fe(), r();
}
ae(Bc, {}, [], [], !0);
function We(e, t) {
  let { enabled: n = !0, trigger: r, type: o = "keydown" } = t;
  function i(s) {
    const a = Array.isArray(r) ? r : [r], l = {
      alt: s.altKey,
      ctrl: s.ctrlKey,
      shift: s.shiftKey,
      meta: s.metaKey
    };
    for (const u of a) {
      const c = {
        modifier: [],
        preventDefault: !1,
        enabled: !0,
        ...u
      }, { modifier: f, key: d, callback: g, preventDefault: p, enabled: x } = c;
      if (x) {
        if (f.length && !(Array.isArray(f) ? f : [f]).map(
          (m) => typeof m == "string" ? [m] : m
        ).some(
          (m) => m.every((_) => l[_])
        ))
          continue;
        if (s.key === d) {
          p && s.preventDefault();
          const C = {
            node: e,
            trigger: c,
            originalEvent: s
          };
          e.dispatchEvent(new CustomEvent("shortcut", { detail: C })), g == null || g(C);
        }
      }
    }
  }
  return n && e.addEventListener(o, i), {
    update: (s) => {
      const { enabled: a = !0, type: l = "keydown" } = s;
      n && (!a || o !== l) ? e.removeEventListener(o, i) : !n && a && e.addEventListener(l, i), n = a, o = l, r = s.trigger;
    },
    destroy: () => {
      e.removeEventListener(o, i);
    }
  };
}
function Yc(e, t) {
  de(t, !1);
  let n = w(t, "selectionKey", 12, "Shift"), r = w(t, "multiSelectionKey", 28, () => yi() ? "Meta" : "Control"), o = w(t, "deleteKey", 12, "Backspace"), i = w(t, "panActivationKey", 12, " "), s = w(t, "zoomActivationKey", 28, () => yi() ? "Meta" : "Control");
  const {
    selectionKeyPressed: a,
    multiselectionKeyPressed: l,
    deleteKeyPressed: u,
    panActivationKeyPressed: c,
    zoomActivationKeyPressed: f,
    selectionRect: d
  } = Ue();
  function g(m) {
    return m !== null && typeof m == "object";
  }
  function p(m) {
    return g(m) ? m.modifier || [] : [];
  }
  function x(m) {
    return m == null ? "" : g(m) ? m.key : m;
  }
  function C(m, _) {
    return (Array.isArray(m) ? m : [m]).map((b) => {
      const N = x(b);
      return {
        key: N,
        modifier: p(b),
        enabled: N !== null,
        callback: _
      };
    });
  }
  function $() {
    d.set(null), a.set(!1), l.set(!1), u.set(!1), c.set(!1), f.set(!1);
  }
  return He(), Ye("blur", Nt, $), Ye("contextmenu", Nt, $), vt(Nt, (m, _) => We == null ? void 0 : We(m, _), () => ({
    trigger: C(n(), () => a.set(!0)),
    type: "keydown"
  })), vt(Nt, (m, _) => We == null ? void 0 : We(m, _), () => ({
    trigger: C(n(), () => a.set(!1)),
    type: "keyup"
  })), vt(Nt, (m, _) => We == null ? void 0 : We(m, _), () => ({
    trigger: C(r(), () => l.set(!0)),
    type: "keydown"
  })), vt(Nt, (m, _) => We == null ? void 0 : We(m, _), () => ({
    trigger: C(r(), () => l.set(!1)),
    type: "keyup"
  })), vt(Nt, (m, _) => We == null ? void 0 : We(m, _), () => ({
    trigger: C(o(), (m) => {
      !(m.originalEvent.ctrlKey || m.originalEvent.metaKey || m.originalEvent.shiftKey) && !w0(m.originalEvent) && u.set(!0);
    }),
    type: "keydown"
  })), vt(Nt, (m, _) => We == null ? void 0 : We(m, _), () => ({
    trigger: C(o(), () => u.set(!1)),
    type: "keyup"
  })), vt(Nt, (m, _) => We == null ? void 0 : We(m, _), () => ({
    trigger: C(i(), () => c.set(!0)),
    type: "keydown"
  })), vt(Nt, (m, _) => We == null ? void 0 : We(m, _), () => ({
    trigger: C(i(), () => c.set(!1)),
    type: "keyup"
  })), vt(Nt, (m, _) => We == null ? void 0 : We(m, _), () => ({
    trigger: C(s(), () => f.set(!0)),
    type: "keydown"
  })), vt(Nt, (m, _) => We == null ? void 0 : We(m, _), () => ({
    trigger: C(s(), () => f.set(!1)),
    type: "keyup"
  })), fe({
    get selectionKey() {
      return n();
    },
    set selectionKey(m) {
      n(m), y();
    },
    get multiSelectionKey() {
      return r();
    },
    set multiSelectionKey(m) {
      r(m), y();
    },
    get deleteKey() {
      return o();
    },
    set deleteKey(m) {
      o(m), y();
    },
    get panActivationKey() {
      return i();
    },
    set panActivationKey(m) {
      i(m), y();
    },
    get zoomActivationKey() {
      return s();
    },
    set zoomActivationKey(m) {
      s(m), y();
    }
  });
}
ae(
  Yc,
  {
    selectionKey: {},
    multiSelectionKey: {},
    deleteKey: {},
    panActivationKey: {},
    zoomActivationKey: {}
  },
  [],
  [],
  !0
);
var R2 = /* @__PURE__ */ _e('<path fill="none" class="svelte-flow__connection-path"></path>'), B2 = /* @__PURE__ */ _e('<svg class="svelte-flow__connectionline"><g><!><!></g></svg>');
function Zc(e, t) {
  de(t, !1);
  const [n, r] = tt(), o = () => Q(g, "$connection", n), i = () => Q(p, "$connectionLineType", n), s = () => Q(f, "$width", n), a = () => Q(d, "$height", n);
  let l = w(t, "containerStyle", 12, ""), u = w(t, "style", 12, ""), c = w(t, "isCustomComponent", 12, !1);
  const {
    width: f,
    height: d,
    connection: g,
    connectionLineType: p
  } = Ue();
  let x = re(null);
  he(
    () => (o(), j(c()), i(), h(x), Hs),
    () => {
      if (o().inProgress && !c()) {
        const { from: v, to: b, fromPosition: N, toPosition: E } = o(), M = {
          sourceX: v.x,
          sourceY: v.y,
          sourcePosition: N,
          targetX: b.x,
          targetY: b.y,
          targetPosition: E
        };
        switch (i()) {
          case Cr.Bezier:
            ((D) => U(x, D[0]))(sc(M));
            break;
          case Cr.Step:
            ((D) => U(x, D[0]))(wi({ ...M, borderRadius: 0 }));
            break;
          case Cr.SmoothStep:
            ((D) => U(x, D[0]))(wi(M));
            break;
          default:
            ((D) => U(x, D[0]))(Hs(M));
        }
      }
    }
  ), gt(), He();
  var C = et(), $ = be(C);
  {
    var m = (v) => {
      var b = B2(), N = X(b), E = X(N);
      pt(E, t, "connectionLine", {});
      var M = z(E);
      {
        var D = (V) => {
          var A = R2();
          Ee(() => {
            ce(A, "d", h(x)), ce(A, "style", u());
          }), L(V, A);
        };
        ke(M, (V) => {
          c() || V(D);
        });
      }
      Z(N), Z(b), Ee(
        (V) => {
          ce(b, "width", s()), ce(b, "height", a()), ce(b, "style", l()), kt(N, 0, bn(V));
        },
        [
          () => Et([
            "svelte-flow__connection",
            c0(o().isValid)
          ])
        ],
        pe
      ), L(v, b);
    };
    ke($, (v) => {
      o().inProgress && v(m);
    });
  }
  L(e, C);
  var _ = fe({
    get containerStyle() {
      return l();
    },
    set containerStyle(v) {
      l(v), y();
    },
    get style() {
      return u();
    },
    set style(v) {
      u(v), y();
    },
    get isCustomComponent() {
      return c();
    },
    set isCustomComponent(v) {
      c(v), y();
    }
  });
  return r(), _;
}
ae(
  Zc,
  {
    containerStyle: {},
    style: {},
    isCustomComponent: {}
  },
  ["connectionLine"],
  [],
  !0
);
var Y2 = /* @__PURE__ */ ne("<div><!></div>");
function Ho(e, t) {
  const n = nt(t, [
    "children",
    "$$slots",
    "$$events",
    "$$legacy",
    "$$host"
  ]), r = nt(n, ["position", "style", "class"]);
  de(t, !1);
  const [o, i] = tt(), s = () => Q(f, "$selectionRectMode", o), a = re();
  let l = w(t, "position", 12, "top-right"), u = w(t, "style", 12, void 0), c = w(t, "class", 12, void 0);
  const { selectionRectMode: f } = Ue();
  he(() => j(l()), () => {
    U(a, `${l()}`.split("-"));
  }), gt(), He();
  var d = Y2();
  let g;
  var p = X(d);
  pt(p, t, "default", {}), Z(d), Ee(
    (C) => {
      g = on(d, g, {
        class: C,
        style: u(),
        ...r
      }), st(d, "pointer-events", s() ? "none" : "");
    },
    [
      () => Et([
        "svelte-flow__panel",
        c(),
        ...h(a)
      ])
    ],
    pe
  ), L(e, d);
  var x = fe({
    get position() {
      return l();
    },
    set position(C) {
      l(C), y();
    },
    get style() {
      return u();
    },
    set style(C) {
      u(C), y();
    },
    get class() {
      return c();
    },
    set class(C) {
      c(C), y();
    }
  });
  return i(), x;
}
ae(Ho, { position: {}, style: {}, class: {} }, ["default"], [], !0);
var Z2 = /* @__PURE__ */ ne('<a href="https://svelteflow.dev" target="_blank" rel="noopener noreferrer" aria-label="Svelte Flow attribution">Svelte Flow</a>');
function Xc(e, t) {
  de(t, !1);
  let n = w(t, "proOptions", 12, void 0), r = w(t, "position", 12, "bottom-right");
  He();
  var o = et(), i = be(o);
  {
    var s = (a) => {
      Ho(a, {
        get position() {
          return r();
        },
        class: "svelte-flow__attribution",
        "data-message": "Feel free to remove the attribution or check out how you could support us: https://svelteflow.dev/support-us",
        children: (l, u) => {
          var c = Z2();
          L(l, c);
        },
        $$slots: { default: !0 }
      });
    };
    ke(i, (a) => {
      var l;
      (l = n()) != null && l.hideAttribution || a(s);
    });
  }
  return L(e, o), fe({
    get proOptions() {
      return n();
    },
    set proOptions(a) {
      n(a), y();
    },
    get position() {
      return r();
    },
    set position(a) {
      r(a), y();
    }
  });
}
ae(Xc, { proOptions: {}, position: {} }, [], [], !0);
function El(e, { nodeTypes: t, edgeTypes: n, minZoom: r, maxZoom: o, translateExtent: i, paneClickDistance: s }) {
  t !== void 0 && e.setNodeTypes(t), n !== void 0 && e.setEdgeTypes(n), r !== void 0 && e.setMinZoom(r), o !== void 0 && e.setMaxZoom(o), i !== void 0 && e.setTranslateExtent(i), s !== void 0 && e.setPaneClickDistance(s);
}
const X2 = (e) => Object.keys(e);
function Sl(e, t) {
  X2(t).forEach((n) => {
    const r = t[n];
    r !== void 0 && e[n].set(r);
  });
}
function F2() {
  return typeof window > "u" || !window.matchMedia ? null : window.matchMedia("(prefers-color-scheme: dark)");
}
function W2(e = "light") {
  return Ft("light", (n) => {
    if (e !== "system") {
      n(e);
      return;
    }
    const r = F2(), o = () => n(r != null && r.matches ? "dark" : "light");
    return n(r != null && r.matches ? "dark" : "light"), r == null || r.addEventListener("change", o), () => {
      r == null || r.removeEventListener("change", o);
    };
  });
}
var K2 = /* @__PURE__ */ ne('<!> <!> <div class="svelte-flow__edgelabel-renderer"></div> <div class="svelte-flow__viewport-portal"></div> <!> <!>', 1), q2 = /* @__PURE__ */ ne("<!> <!>", 1), G2 = /* @__PURE__ */ ne("<div><!> <!> <!> <!></div>");
const U2 = {
  hash: "svelte-12wlba6",
  code: ".svelte-flow.svelte-12wlba6 {width:100%;height:100%;overflow:hidden;position:relative;z-index:0;background-color:var(--background-color, var(--background-color-default));}:root {--background-color-default: #fff;--background-pattern-color-default: #ddd;--minimap-mask-color-default: rgb(240, 240, 240, 0.6);--minimap-mask-stroke-color-default: none;--minimap-mask-stroke-width-default: 1;--controls-button-background-color-default: #fefefe;--controls-button-background-color-hover-default: #f4f4f4;--controls-button-color-default: inherit;--controls-button-color-hover-default: inherit;--controls-button-border-color-default: #eee;}"
};
function Fc(e, t) {
  const n = p1(t), r = nt(t, [
    "children",
    "$$slots",
    "$$events",
    "$$legacy",
    "$$host"
  ]), o = nt(r, [
    "id",
    "nodes",
    "edges",
    "fitView",
    "fitViewOptions",
    "minZoom",
    "maxZoom",
    "initialViewport",
    "viewport",
    "nodeTypes",
    "edgeTypes",
    "selectionKey",
    "selectionMode",
    "panActivationKey",
    "multiSelectionKey",
    "zoomActivationKey",
    "nodesDraggable",
    "nodesConnectable",
    "nodeDragThreshold",
    "elementsSelectable",
    "snapGrid",
    "deleteKey",
    "connectionRadius",
    "connectionLineType",
    "connectionMode",
    "connectionLineStyle",
    "connectionLineContainerStyle",
    "onMoveStart",
    "onMove",
    "onMoveEnd",
    "isValidConnection",
    "translateExtent",
    "nodeExtent",
    "onlyRenderVisibleElements",
    "panOnScrollMode",
    "preventScrolling",
    "zoomOnScroll",
    "zoomOnDoubleClick",
    "zoomOnPinch",
    "panOnScroll",
    "panOnDrag",
    "selectionOnDrag",
    "autoPanOnConnect",
    "autoPanOnNodeDrag",
    "onerror",
    "ondelete",
    "onedgecreate",
    "attributionPosition",
    "proOptions",
    "defaultEdgeOptions",
    "width",
    "height",
    "colorMode",
    "onconnect",
    "onconnectstart",
    "onconnectend",
    "onbeforedelete",
    "oninit",
    "nodeOrigin",
    "paneClickDistance",
    "nodeClickDistance",
    "defaultMarkerColor",
    "style",
    "class"
  ]);
  de(t, !1), Je(e, U2);
  const [i, s] = tt(), a = () => Q(_(), "$viewport", i), l = () => Q(ji, "$initialized", i), u = () => Q(h(c), "$colorModeClass", i), c = re();
  let f = w(t, "id", 12, "1"), d = w(t, "nodes", 12), g = w(t, "edges", 12), p = w(t, "fitView", 12, void 0), x = w(t, "fitViewOptions", 12, void 0), C = w(t, "minZoom", 12, void 0), $ = w(t, "maxZoom", 12, void 0), m = w(t, "initialViewport", 12, void 0), _ = w(t, "viewport", 12, void 0), v = w(t, "nodeTypes", 12, void 0), b = w(t, "edgeTypes", 12, void 0), N = w(t, "selectionKey", 12, void 0), E = w(t, "selectionMode", 12, void 0), M = w(t, "panActivationKey", 12, void 0), D = w(t, "multiSelectionKey", 12, void 0), V = w(t, "zoomActivationKey", 12, void 0), A = w(t, "nodesDraggable", 12, void 0), O = w(t, "nodesConnectable", 12, void 0), R = w(t, "nodeDragThreshold", 12, void 0), S = w(t, "elementsSelectable", 12, void 0), T = w(t, "snapGrid", 12, void 0), k = w(t, "deleteKey", 12, void 0), P = w(t, "connectionRadius", 12, void 0), H = w(t, "connectionLineType", 12, void 0), I = w(t, "connectionMode", 28, () => cr.Strict), B = w(t, "connectionLineStyle", 12, ""), F = w(t, "connectionLineContainerStyle", 12, ""), K = w(t, "onMoveStart", 12, void 0), ie = w(t, "onMove", 12, void 0), ee = w(t, "onMoveEnd", 12, void 0), W = w(t, "isValidConnection", 12, void 0), ue = w(t, "translateExtent", 12, void 0), me = w(t, "nodeExtent", 12, void 0), Ce = w(t, "onlyRenderVisibleElements", 12, void 0), ge = w(t, "panOnScrollMode", 28, () => qn.Free), ze = w(t, "preventScrolling", 12, !0), G = w(t, "zoomOnScroll", 12, !0), se = w(t, "zoomOnDoubleClick", 12, !0), Te = w(t, "zoomOnPinch", 12, !0), Ae = w(t, "panOnScroll", 12, !1), Xe = w(t, "panOnDrag", 12, !0), te = w(t, "selectionOnDrag", 12, void 0), Fe = w(t, "autoPanOnConnect", 12, !0), Le = w(t, "autoPanOnNodeDrag", 12, !0), Qe = w(t, "onerror", 12, void 0), oe = w(t, "ondelete", 12, void 0), ve = w(t, "onedgecreate", 12, void 0), xe = w(t, "attributionPosition", 12, void 0), Oe = w(t, "proOptions", 12, void 0), ct = w(t, "defaultEdgeOptions", 12, void 0), lt = w(t, "width", 12, void 0), J = w(t, "height", 12, void 0), Re = w(t, "colorMode", 12, "light"), le = w(t, "onconnect", 12, void 0), fn = w(t, "onconnectstart", 12, void 0), Ut = w(t, "onconnectend", 12, void 0), gn = w(t, "onbeforedelete", 12, void 0), Ne = w(t, "oninit", 12, void 0), rt = w(t, "nodeOrigin", 12, void 0), ye = w(t, "paneClickDistance", 12, 0), ot = w(t, "nodeClickDistance", 12, 0), at = w(t, "defaultMarkerColor", 12, "#b1b1b7"), Xt = w(t, "style", 12, void 0), Kr = w(t, "class", 12, void 0), At = re(), St = re(), hn = re();
  const jt = a() || m(), ft = Uf(Wi) ? Ue() : w2({
    nodes: q(d()),
    edges: q(g()),
    width: lt(),
    height: J(),
    fitView: p(),
    nodeOrigin: rt(),
    nodeExtent: me()
  });
  un(() => (ft.width.set(h(St)), ft.height.set(h(hn)), ft.domNode.set(h(At)), ft.syncNodeStores(d()), ft.syncEdgeStores(g()), ft.syncViewport(_()), p() !== void 0 && ft.fitViewOnInit.set(p()), x() && ft.fitViewOptions.set(x()), El(ft, {
    nodeTypes: v(),
    edgeTypes: b(),
    minZoom: C(),
    maxZoom: $(),
    translateExtent: ue(),
    paneClickDistance: ye()
  }), () => {
    ft.reset();
  }));
  const { initialized: ji } = ft;
  let nr = re(!1);
  he(
    () => (h(St), h(hn)),
    () => {
      h(St) !== void 0 && h(hn) !== void 0 && (ft.width.set(h(St)), ft.height.set(h(hn)));
    }
  ), he(
    () => (h(nr), l(), j(Ne())),
    () => {
      var Y;
      !h(nr) && l() && ((Y = Ne()) == null || Y(), U(nr, !0));
    }
  ), he(
    () => (j(f()), j(H()), j(P()), j(E()), j(T()), j(at()), j(A()), j(O()), j(S()), j(Ce()), j(W()), j(Fe()), j(Le()), j(Qe()), j(oe()), j(ve()), j(I()), j(R()), j(le()), j(fn()), j(Ut()), j(gn()), j(rt()), Sl),
    () => {
      const Y = {
        flowId: f(),
        connectionLineType: H(),
        connectionRadius: P(),
        selectionMode: E(),
        snapGrid: T(),
        defaultMarkerColor: at(),
        nodesDraggable: A(),
        nodesConnectable: O(),
        elementsSelectable: S(),
        onlyRenderVisibleElements: Ce(),
        isValidConnection: W(),
        autoPanOnConnect: Fe(),
        autoPanOnNodeDrag: Le(),
        onerror: Qe(),
        ondelete: oe(),
        onedgecreate: ve(),
        connectionMode: I(),
        nodeDragThreshold: R(),
        onconnect: le(),
        onconnectstart: fn(),
        onconnectend: Ut(),
        onbeforedelete: gn(),
        nodeOrigin: rt()
      };
      Sl(ft, Y);
    }
  ), he(
    () => (j(v()), j(b()), j(C()), j($()), j(ue()), j(ye())),
    () => {
      El(ft, {
        nodeTypes: v(),
        edgeTypes: b(),
        minZoom: C(),
        maxZoom: $(),
        translateExtent: ue(),
        paneClickDistance: ye()
      });
    }
  ), he(
    () => j(Re()),
    () => {
      k1(U(c, W2(Re())), "$colorModeClass", i);
    }
  ), gt(), He();
  var Jt = G2();
  let Io;
  var zo = X(Jt);
  Yc(zo, {
    get selectionKey() {
      return N();
    },
    get deleteKey() {
      return k();
    },
    get panActivationKey() {
      return M();
    },
    get multiSelectionKey() {
      return D();
    },
    get zoomActivationKey() {
      return V();
    }
  });
  var Ro = z(zo, 2);
  const Rd = /* @__PURE__ */ pe(() => ge() === void 0 ? qn.Free : ge()), Bd = /* @__PURE__ */ pe(() => ze() === void 0 ? !0 : ze()), Yd = /* @__PURE__ */ pe(() => G() === void 0 ? !0 : G()), Zd = /* @__PURE__ */ pe(() => se() === void 0 ? !0 : se()), Xd = /* @__PURE__ */ pe(() => Te() === void 0 ? !0 : Te()), Fd = /* @__PURE__ */ pe(() => Ae() === void 0 ? !1 : Ae()), Wd = /* @__PURE__ */ pe(() => Xe() === void 0 ? !0 : Xe()), Kd = /* @__PURE__ */ pe(() => ye() === void 0 ? 0 : ye());
  Mc(Ro, {
    initialViewport: jt,
    get onMoveStart() {
      return K();
    },
    get onMove() {
      return ie();
    },
    get onMoveEnd() {
      return ee();
    },
    get panOnScrollMode() {
      return h(Rd);
    },
    get preventScrolling() {
      return h(Bd);
    },
    get zoomOnScroll() {
      return h(Yd);
    },
    get zoomOnDoubleClick() {
      return h(Zd);
    },
    get zoomOnPinch() {
      return h(Xd);
    },
    get panOnScroll() {
      return h(Fd);
    },
    get panOnDrag() {
      return h(Wd);
    },
    get paneClickDistance() {
      return h(Kd);
    },
    children: (Y, gw) => {
      const Ud = /* @__PURE__ */ pe(() => Xe() === void 0 ? !0 : Xe());
      Tc(Y, {
        get panOnDrag() {
          return h(Ud);
        },
        get selectionOnDrag() {
          return te();
        },
        $$events: {
          paneclick(qr) {
            Ve.call(this, t, qr);
          },
          panecontextmenu(qr) {
            Ve.call(this, t, qr);
          }
        },
        children: (qr, hw) => {
          var xa = q2(), ba = be(xa);
          Hc(ba, {
            children: (Jd, vw) => {
              var Ca = K2(), ka = be(Ca);
              zc(ka, {
                get defaultEdgeOptions() {
                  return ct();
                },
                $$events: {
                  edgeclick(Be) {
                    Ve.call(this, t, Be);
                  },
                  edgecontextmenu(Be) {
                    Ve.call(this, t, Be);
                  },
                  edgemouseenter(Be) {
                    Ve.call(this, t, Be);
                  },
                  edgemouseleave(Be) {
                    Ve.call(this, t, Be);
                  }
                }
              });
              var $a = z(ka, 2);
              Zc($a, {
                get containerStyle() {
                  return F();
                },
                get style() {
                  return B();
                },
                isCustomComponent: n.connectionLine,
                $$slots: {
                  connectionLine: (Be, pw) => {
                    var Sa = et(), ef = be(Sa);
                    pt(ef, t, "connectionLine", {}), L(Be, Sa);
                  }
                }
              });
              var Ea = z($a, 6);
              Dc(Ea, {
                get nodeClickDistance() {
                  return ot();
                },
                $$events: {
                  nodeclick(Be) {
                    Ve.call(this, t, Be);
                  },
                  nodemouseenter(Be) {
                    Ve.call(this, t, Be);
                  },
                  nodemousemove(Be) {
                    Ve.call(this, t, Be);
                  },
                  nodemouseleave(Be) {
                    Ve.call(this, t, Be);
                  },
                  nodedragstart(Be) {
                    Ve.call(this, t, Be);
                  },
                  nodedrag(Be) {
                    Ve.call(this, t, Be);
                  },
                  nodedragstop(Be) {
                    Ve.call(this, t, Be);
                  },
                  nodecontextmenu(Be) {
                    Ve.call(this, t, Be);
                  }
                }
              });
              var Qd = z(Ea, 2);
              Bc(Qd, {
                $$events: {
                  selectionclick(Be) {
                    Ve.call(this, t, Be);
                  },
                  selectioncontextmenu(Be) {
                    Ve.call(this, t, Be);
                  },
                  nodedragstart(Be) {
                    Ve.call(this, t, Be);
                  },
                  nodedrag(Be) {
                    Ve.call(this, t, Be);
                  },
                  nodedragstop(Be) {
                    Ve.call(this, t, Be);
                  }
                }
              }), L(Jd, Ca);
            },
            $$slots: { default: !0 }
          });
          var jd = z(ba, 2);
          Rc(jd, {}), L(qr, xa);
        },
        $$slots: { default: !0 }
      });
    },
    $$slots: { default: !0 }
  });
  var _a = z(Ro, 2);
  Xc(_a, {
    get proOptions() {
      return Oe();
    },
    get position() {
      return xe();
    }
  });
  var qd = z(_a, 2);
  pt(qd, t, "default", {}), Z(Jt), An(Jt, (Y) => U(At, Y), () => h(At)), Ee(
    (Y) => Io = on(
      Jt,
      Io,
      {
        style: Xt(),
        class: Y,
        "data-testid": "svelte-flow__wrapper",
        ...o,
        role: "application"
      },
      "svelte-12wlba6"
    ),
    [
      () => Et([
        "svelte-flow",
        Kr(),
        u()
      ])
    ],
    pe
  ), Ra(Jt, "clientWidth", (Y) => U(St, Y)), Ra(Jt, "clientHeight", (Y) => U(hn, Y)), Ye("dragover", Jt, function(Y) {
    Ve.call(this, t, Y);
  }), Ye("drop", Jt, function(Y) {
    Ve.call(this, t, Y);
  }), L(e, Jt);
  var Gd = fe({
    get id() {
      return f();
    },
    set id(Y) {
      f(Y), y();
    },
    get nodes() {
      return d();
    },
    set nodes(Y) {
      d(Y), y();
    },
    get edges() {
      return g();
    },
    set edges(Y) {
      g(Y), y();
    },
    get fitView() {
      return p();
    },
    set fitView(Y) {
      p(Y), y();
    },
    get fitViewOptions() {
      return x();
    },
    set fitViewOptions(Y) {
      x(Y), y();
    },
    get minZoom() {
      return C();
    },
    set minZoom(Y) {
      C(Y), y();
    },
    get maxZoom() {
      return $();
    },
    set maxZoom(Y) {
      $(Y), y();
    },
    get initialViewport() {
      return m();
    },
    set initialViewport(Y) {
      m(Y), y();
    },
    get viewport() {
      return _();
    },
    set viewport(Y) {
      _(Y), y();
    },
    get nodeTypes() {
      return v();
    },
    set nodeTypes(Y) {
      v(Y), y();
    },
    get edgeTypes() {
      return b();
    },
    set edgeTypes(Y) {
      b(Y), y();
    },
    get selectionKey() {
      return N();
    },
    set selectionKey(Y) {
      N(Y), y();
    },
    get selectionMode() {
      return E();
    },
    set selectionMode(Y) {
      E(Y), y();
    },
    get panActivationKey() {
      return M();
    },
    set panActivationKey(Y) {
      M(Y), y();
    },
    get multiSelectionKey() {
      return D();
    },
    set multiSelectionKey(Y) {
      D(Y), y();
    },
    get zoomActivationKey() {
      return V();
    },
    set zoomActivationKey(Y) {
      V(Y), y();
    },
    get nodesDraggable() {
      return A();
    },
    set nodesDraggable(Y) {
      A(Y), y();
    },
    get nodesConnectable() {
      return O();
    },
    set nodesConnectable(Y) {
      O(Y), y();
    },
    get nodeDragThreshold() {
      return R();
    },
    set nodeDragThreshold(Y) {
      R(Y), y();
    },
    get elementsSelectable() {
      return S();
    },
    set elementsSelectable(Y) {
      S(Y), y();
    },
    get snapGrid() {
      return T();
    },
    set snapGrid(Y) {
      T(Y), y();
    },
    get deleteKey() {
      return k();
    },
    set deleteKey(Y) {
      k(Y), y();
    },
    get connectionRadius() {
      return P();
    },
    set connectionRadius(Y) {
      P(Y), y();
    },
    get connectionLineType() {
      return H();
    },
    set connectionLineType(Y) {
      H(Y), y();
    },
    get connectionMode() {
      return I();
    },
    set connectionMode(Y) {
      I(Y), y();
    },
    get connectionLineStyle() {
      return B();
    },
    set connectionLineStyle(Y) {
      B(Y), y();
    },
    get connectionLineContainerStyle() {
      return F();
    },
    set connectionLineContainerStyle(Y) {
      F(Y), y();
    },
    get onMoveStart() {
      return K();
    },
    set onMoveStart(Y) {
      K(Y), y();
    },
    get onMove() {
      return ie();
    },
    set onMove(Y) {
      ie(Y), y();
    },
    get onMoveEnd() {
      return ee();
    },
    set onMoveEnd(Y) {
      ee(Y), y();
    },
    get isValidConnection() {
      return W();
    },
    set isValidConnection(Y) {
      W(Y), y();
    },
    get translateExtent() {
      return ue();
    },
    set translateExtent(Y) {
      ue(Y), y();
    },
    get nodeExtent() {
      return me();
    },
    set nodeExtent(Y) {
      me(Y), y();
    },
    get onlyRenderVisibleElements() {
      return Ce();
    },
    set onlyRenderVisibleElements(Y) {
      Ce(Y), y();
    },
    get panOnScrollMode() {
      return ge();
    },
    set panOnScrollMode(Y) {
      ge(Y), y();
    },
    get preventScrolling() {
      return ze();
    },
    set preventScrolling(Y) {
      ze(Y), y();
    },
    get zoomOnScroll() {
      return G();
    },
    set zoomOnScroll(Y) {
      G(Y), y();
    },
    get zoomOnDoubleClick() {
      return se();
    },
    set zoomOnDoubleClick(Y) {
      se(Y), y();
    },
    get zoomOnPinch() {
      return Te();
    },
    set zoomOnPinch(Y) {
      Te(Y), y();
    },
    get panOnScroll() {
      return Ae();
    },
    set panOnScroll(Y) {
      Ae(Y), y();
    },
    get panOnDrag() {
      return Xe();
    },
    set panOnDrag(Y) {
      Xe(Y), y();
    },
    get selectionOnDrag() {
      return te();
    },
    set selectionOnDrag(Y) {
      te(Y), y();
    },
    get autoPanOnConnect() {
      return Fe();
    },
    set autoPanOnConnect(Y) {
      Fe(Y), y();
    },
    get autoPanOnNodeDrag() {
      return Le();
    },
    set autoPanOnNodeDrag(Y) {
      Le(Y), y();
    },
    get onerror() {
      return Qe();
    },
    set onerror(Y) {
      Qe(Y), y();
    },
    get ondelete() {
      return oe();
    },
    set ondelete(Y) {
      oe(Y), y();
    },
    get onedgecreate() {
      return ve();
    },
    set onedgecreate(Y) {
      ve(Y), y();
    },
    get attributionPosition() {
      return xe();
    },
    set attributionPosition(Y) {
      xe(Y), y();
    },
    get proOptions() {
      return Oe();
    },
    set proOptions(Y) {
      Oe(Y), y();
    },
    get defaultEdgeOptions() {
      return ct();
    },
    set defaultEdgeOptions(Y) {
      ct(Y), y();
    },
    get width() {
      return lt();
    },
    set width(Y) {
      lt(Y), y();
    },
    get height() {
      return J();
    },
    set height(Y) {
      J(Y), y();
    },
    get colorMode() {
      return Re();
    },
    set colorMode(Y) {
      Re(Y), y();
    },
    get onconnect() {
      return le();
    },
    set onconnect(Y) {
      le(Y), y();
    },
    get onconnectstart() {
      return fn();
    },
    set onconnectstart(Y) {
      fn(Y), y();
    },
    get onconnectend() {
      return Ut();
    },
    set onconnectend(Y) {
      Ut(Y), y();
    },
    get onbeforedelete() {
      return gn();
    },
    set onbeforedelete(Y) {
      gn(Y), y();
    },
    get oninit() {
      return Ne();
    },
    set oninit(Y) {
      Ne(Y), y();
    },
    get nodeOrigin() {
      return rt();
    },
    set nodeOrigin(Y) {
      rt(Y), y();
    },
    get paneClickDistance() {
      return ye();
    },
    set paneClickDistance(Y) {
      ye(Y), y();
    },
    get nodeClickDistance() {
      return ot();
    },
    set nodeClickDistance(Y) {
      ot(Y), y();
    },
    get defaultMarkerColor() {
      return at();
    },
    set defaultMarkerColor(Y) {
      at(Y), y();
    },
    get style() {
      return Xt();
    },
    set style(Y) {
      Xt(Y), y();
    },
    get class() {
      return Kr();
    },
    set class(Y) {
      Kr(Y), y();
    }
  });
  return s(), Gd;
}
ae(
  Fc,
  {
    id: {},
    nodes: {},
    edges: {},
    fitView: {},
    fitViewOptions: {},
    minZoom: {},
    maxZoom: {},
    initialViewport: {},
    viewport: {},
    nodeTypes: {},
    edgeTypes: {},
    selectionKey: {},
    selectionMode: {},
    panActivationKey: {},
    multiSelectionKey: {},
    zoomActivationKey: {},
    nodesDraggable: {},
    nodesConnectable: {},
    nodeDragThreshold: {},
    elementsSelectable: {},
    snapGrid: {},
    deleteKey: {},
    connectionRadius: {},
    connectionLineType: {},
    connectionMode: {},
    connectionLineStyle: {},
    connectionLineContainerStyle: {},
    onMoveStart: {},
    onMove: {},
    onMoveEnd: {},
    isValidConnection: {},
    translateExtent: {},
    nodeExtent: {},
    onlyRenderVisibleElements: {},
    panOnScrollMode: {},
    preventScrolling: {},
    zoomOnScroll: {},
    zoomOnDoubleClick: {},
    zoomOnPinch: {},
    panOnScroll: {},
    panOnDrag: {},
    selectionOnDrag: {},
    autoPanOnConnect: {},
    autoPanOnNodeDrag: {},
    onerror: {},
    ondelete: {},
    onedgecreate: {},
    attributionPosition: {},
    proOptions: {},
    defaultEdgeOptions: {},
    width: {},
    height: {},
    colorMode: {},
    onconnect: {},
    onconnectstart: {},
    onconnectend: {},
    onbeforedelete: {},
    oninit: {},
    nodeOrigin: {},
    paneClickDistance: {},
    nodeClickDistance: {},
    defaultMarkerColor: {},
    style: {},
    class: {}
  },
  ["connectionLine", "default"],
  [],
  !0
);
function Wc(e, t) {
  de(t, !1);
  let n = w(t, "initialNodes", 12, void 0), r = w(t, "initialEdges", 12, void 0), o = w(t, "initialWidth", 12, void 0), i = w(t, "initialHeight", 12, void 0), s = w(t, "fitView", 12, void 0), a = w(t, "nodeOrigin", 12, void 0);
  const l = Nc({
    nodes: n(),
    edges: r(),
    width: o(),
    height: i(),
    nodeOrigin: a(),
    fitView: s()
  });
  Tr(Wi, { getStore: () => l }), Qs(() => {
    l.reset();
  }), He();
  var u = et(), c = be(u);
  return pt(c, t, "default", {}), L(e, u), fe({
    get initialNodes() {
      return n();
    },
    set initialNodes(f) {
      n(f), y();
    },
    get initialEdges() {
      return r();
    },
    set initialEdges(f) {
      r(f), y();
    },
    get initialWidth() {
      return o();
    },
    set initialWidth(f) {
      o(f), y();
    },
    get initialHeight() {
      return i();
    },
    set initialHeight(f) {
      i(f), y();
    },
    get fitView() {
      return s();
    },
    set fitView(f) {
      s(f), y();
    },
    get nodeOrigin() {
      return a();
    },
    set nodeOrigin(f) {
      a(f), y();
    }
  });
}
ae(
  Wc,
  {
    initialNodes: {},
    initialEdges: {},
    initialWidth: {},
    initialHeight: {},
    fitView: {},
    nodeOrigin: {}
  },
  ["default"],
  [],
  !0
);
var j2 = /* @__PURE__ */ ne("<button><!></button>");
function ro(e, t) {
  const n = nt(t, [
    "children",
    "$$slots",
    "$$events",
    "$$legacy",
    "$$host"
  ]), r = nt(n, [
    "class",
    "bgColor",
    "bgColorHover",
    "color",
    "colorHover",
    "borderColor"
  ]);
  de(t, !1);
  let o = w(t, "class", 12, void 0), i = w(t, "bgColor", 12, void 0), s = w(t, "bgColorHover", 12, void 0), a = w(t, "color", 12, void 0), l = w(t, "colorHover", 12, void 0), u = w(t, "borderColor", 12, void 0);
  He();
  var c = j2();
  let f;
  var d = X(c);
  return pt(d, t, "default", { class: "button-svg" }), Z(c), Ee(
    (g) => {
      f = on(c, f, { type: "button", class: g, ...r }), st(c, "--xy-controls-button-background-color-props", i()), st(c, "--xy-controls-button-background-color-hover-props", s()), st(c, "--xy-controls-button-color-props", a()), st(c, "--xy-controls-button-color-hover-props", l()), st(c, "--xy-controls-button-border-color-props", u());
    },
    [
      () => Et([
        "svelte-flow__controls-button",
        o()
      ])
    ],
    pe
  ), Ye("click", c, function(g) {
    Ve.call(this, t, g);
  }), L(e, c), fe({
    get class() {
      return o();
    },
    set class(g) {
      o(g), y();
    },
    get bgColor() {
      return i();
    },
    set bgColor(g) {
      i(g), y();
    },
    get bgColorHover() {
      return s();
    },
    set bgColorHover(g) {
      s(g), y();
    },
    get color() {
      return a();
    },
    set color(g) {
      a(g), y();
    },
    get colorHover() {
      return l();
    },
    set colorHover(g) {
      l(g), y();
    },
    get borderColor() {
      return u();
    },
    set borderColor(g) {
      u(g), y();
    }
  });
}
ae(
  ro,
  {
    class: {},
    bgColor: {},
    bgColorHover: {},
    color: {},
    colorHover: {},
    borderColor: {}
  },
  ["default"],
  [],
  !0
);
var J2 = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M32 18.133H18.133V32h-4.266V18.133H0v-4.266h13.867V0h4.266v13.867H32z"></path></svg>');
function Kc(e) {
  var t = J2();
  L(e, t);
}
ae(Kc, {}, [], [], !0);
var Q2 = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 5"><path d="M0 0h32v4.2H0z"></path></svg>');
function qc(e) {
  var t = Q2();
  L(e, t);
}
ae(qc, {}, [], [], !0);
var ep = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 30"><path d="M3.692 4.63c0-.53.4-.938.939-.938h5.215V0H4.708C2.13 0 0 2.054 0 4.63v5.216h3.692V4.631zM27.354 0h-5.2v3.692h5.17c.53 0 .984.4.984.939v5.215H32V4.631A4.624 4.624 0 0027.354 0zm.954 24.83c0 .532-.4.94-.939.94h-5.215v3.768h5.215c2.577 0 4.631-2.13 4.631-4.707v-5.139h-3.692v5.139zm-23.677.94c-.531 0-.939-.4-.939-.94v-5.138H0v5.139c0 2.577 2.13 4.707 4.708 4.707h5.138V25.77H4.631z"></path></svg>');
function Gc(e) {
  var t = ep();
  L(e, t);
}
ae(Gc, {}, [], [], !0);
var tp = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 32"><path d="M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0 8 0 4.571 3.429 4.571 7.619v3.048H3.048A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047zm4.724-13.866H7.467V7.619c0-2.59 2.133-4.724 4.723-4.724 2.591 0 4.724 2.133 4.724 4.724v3.048z"></path></svg>');
function Uc(e) {
  var t = tp();
  L(e, t);
}
ae(Uc, {}, [], [], !0);
var np = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 32"><path d="M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0c-4.114 1.828-1.37 2.133.305 2.438 1.676.305 4.42 2.59 4.42 5.181v3.048H3.047A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047z"></path></svg>');
function jc(e) {
  var t = np();
  L(e, t);
}
ae(jc, {}, [], [], !0);
var rp = /* @__PURE__ */ ne("<!> <!>", 1), op = /* @__PURE__ */ ne("<!> <!> <!> <!> <!> <!>", 1);
function Jc(e, t) {
  de(t, !1);
  const [n, r] = tt(), o = () => Q(H, "$nodesDraggable", n), i = () => Q(I, "$nodesConnectable", n), s = () => Q(B, "$elementsSelectable", n), a = () => Q(T, "$viewport", n), l = () => Q(k, "$minZoom", n), u = () => Q(P, "$maxZoom", n), c = re(), f = re(), d = re(), g = re();
  let p = w(t, "position", 12, "bottom-left"), x = w(t, "showZoom", 12, !0), C = w(t, "showFitView", 12, !0), $ = w(t, "showLock", 12, !0), m = w(t, "buttonBgColor", 12, void 0), _ = w(t, "buttonBgColorHover", 12, void 0), v = w(t, "buttonColor", 12, void 0), b = w(t, "buttonColorHover", 12, void 0), N = w(t, "buttonBorderColor", 12, void 0), E = w(t, "ariaLabel", 12, void 0), M = w(t, "style", 12, void 0), D = w(t, "orientation", 12, "vertical"), V = w(t, "fitViewOptions", 12, void 0), A = w(t, "class", 12, "");
  const {
    zoomIn: O,
    zoomOut: R,
    fitView: S,
    viewport: T,
    minZoom: k,
    maxZoom: P,
    nodesDraggable: H,
    nodesConnectable: I,
    elementsSelectable: B
  } = Ue(), F = {
    bgColor: m(),
    bgColorHover: _(),
    color: v(),
    colorHover: b(),
    borderColor: N()
  }, K = () => {
    O();
  }, ie = () => {
    R();
  }, ee = () => {
    S(V());
  }, W = () => {
    U(c, !h(c)), H.set(h(c)), I.set(h(c)), B.set(h(c));
  };
  he(
    () => (o(), i(), s()),
    () => {
      U(c, o() || i() || s());
    }
  ), he(() => (a(), l()), () => {
    U(f, a().zoom <= l());
  }), he(() => (a(), u()), () => {
    U(d, a().zoom >= u());
  }), he(() => j(D()), () => {
    U(g, D() === "horizontal" ? "horizontal" : "vertical");
  }), gt(), He();
  const ue = /* @__PURE__ */ pe(() => Et([
    "svelte-flow__controls",
    h(g),
    A()
  ])), me = /* @__PURE__ */ pe(() => E() ?? "Svelte Flow controls");
  Ho(e, {
    get class() {
      return h(ue);
    },
    get position() {
      return p();
    },
    "data-testid": "svelte-flow__controls",
    get "aria-label"() {
      return h(me);
    },
    get style() {
      return M();
    },
    children: (ge, ze) => {
      var G = op(), se = be(G);
      pt(se, t, "before", {});
      var Te = z(se, 2);
      {
        var Ae = (ve) => {
          var xe = rp(), Oe = be(xe);
          ro(Oe, ut(
            {
              class: "svelte-flow__controls-zoomin",
              title: "zoom in",
              "aria-label": "zoom in",
              get disabled() {
                return h(d);
              }
            },
            F,
            {
              $$events: { click: K },
              children: (lt, J) => {
                Kc(lt);
              },
              $$slots: { default: !0 }
            }
          ));
          var ct = z(Oe, 2);
          ro(ct, ut(
            {
              class: "svelte-flow__controls-zoomout",
              title: "zoom out",
              "aria-label": "zoom out",
              get disabled() {
                return h(f);
              }
            },
            F,
            {
              $$events: { click: ie },
              children: (lt, J) => {
                qc(lt);
              },
              $$slots: { default: !0 }
            }
          )), L(ve, xe);
        };
        ke(Te, (ve) => {
          x() && ve(Ae);
        });
      }
      var Xe = z(Te, 2);
      {
        var te = (ve) => {
          ro(ve, ut(
            {
              class: "svelte-flow__controls-fitview",
              title: "fit view",
              "aria-label": "fit view"
            },
            F,
            {
              $$events: { click: ee },
              children: (xe, Oe) => {
                Gc(xe);
              },
              $$slots: { default: !0 }
            }
          ));
        };
        ke(Xe, (ve) => {
          C() && ve(te);
        });
      }
      var Fe = z(Xe, 2);
      {
        var Le = (ve) => {
          ro(ve, ut(
            {
              class: "svelte-flow__controls-interactive",
              title: "toggle interactivity",
              "aria-label": "toggle interactivity"
            },
            F,
            {
              $$events: { click: W },
              children: (xe, Oe) => {
                var ct = et(), lt = be(ct);
                {
                  var J = (le) => {
                    jc(le);
                  }, Re = (le) => {
                    Uc(le);
                  };
                  ke(lt, (le) => {
                    h(c) ? le(J) : le(Re, !1);
                  });
                }
                L(xe, ct);
              },
              $$slots: { default: !0 }
            }
          ));
        };
        ke(Fe, (ve) => {
          $() && ve(Le);
        });
      }
      var Qe = z(Fe, 2);
      pt(Qe, t, "default", {});
      var oe = z(Qe, 2);
      pt(oe, t, "after", {}), L(ge, G);
    },
    $$slots: { default: !0 }
  });
  var Ce = fe({
    get position() {
      return p();
    },
    set position(ge) {
      p(ge), y();
    },
    get showZoom() {
      return x();
    },
    set showZoom(ge) {
      x(ge), y();
    },
    get showFitView() {
      return C();
    },
    set showFitView(ge) {
      C(ge), y();
    },
    get showLock() {
      return $();
    },
    set showLock(ge) {
      $(ge), y();
    },
    get buttonBgColor() {
      return m();
    },
    set buttonBgColor(ge) {
      m(ge), y();
    },
    get buttonBgColorHover() {
      return _();
    },
    set buttonBgColorHover(ge) {
      _(ge), y();
    },
    get buttonColor() {
      return v();
    },
    set buttonColor(ge) {
      v(ge), y();
    },
    get buttonColorHover() {
      return b();
    },
    set buttonColorHover(ge) {
      b(ge), y();
    },
    get buttonBorderColor() {
      return N();
    },
    set buttonBorderColor(ge) {
      N(ge), y();
    },
    get ariaLabel() {
      return E();
    },
    set ariaLabel(ge) {
      E(ge), y();
    },
    get style() {
      return M();
    },
    set style(ge) {
      M(ge), y();
    },
    get orientation() {
      return D();
    },
    set orientation(ge) {
      D(ge), y();
    },
    get fitViewOptions() {
      return V();
    },
    set fitViewOptions(ge) {
      V(ge), y();
    },
    get class() {
      return A();
    },
    set class(ge) {
      A(ge), y();
    }
  });
  return r(), Ce;
}
ae(
  Jc,
  {
    position: {},
    showZoom: {},
    showFitView: {},
    showLock: {},
    buttonBgColor: {},
    buttonBgColorHover: {},
    buttonColor: {},
    buttonColorHover: {},
    buttonBorderColor: {},
    ariaLabel: {},
    style: {},
    orientation: {},
    fitViewOptions: {},
    class: {}
  },
  ["before", "default", "after"],
  [],
  !0
);
var Gn;
(function(e) {
  e.Lines = "lines", e.Dots = "dots", e.Cross = "cross";
})(Gn || (Gn = {}));
var ip = /* @__PURE__ */ _e("<circle></circle>");
function Qc(e, t) {
  de(t, !1);
  let n = w(t, "radius", 12, 5), r = w(t, "class", 12, "");
  He();
  var o = ip();
  return Ee(
    (i) => {
      ce(o, "cx", n()), ce(o, "cy", n()), ce(o, "r", n()), kt(o, 0, bn(i));
    },
    [
      () => Et([
        "svelte-flow__background-pattern",
        "dots",
        r()
      ])
    ],
    pe
  ), L(e, o), fe({
    get radius() {
      return n();
    },
    set radius(i) {
      n(i), y();
    },
    get class() {
      return r();
    },
    set class(i) {
      r(i), y();
    }
  });
}
ae(Qc, { radius: {}, class: {} }, [], [], !0);
var sp = /* @__PURE__ */ _e("<path></path>");
function ed(e, t) {
  de(t, !1);
  let n = w(t, "lineWidth", 12, 1), r = w(t, "dimensions", 12), o = w(t, "variant", 12, void 0), i = w(t, "class", 12, "");
  He();
  var s = sp();
  return Ee(
    (a) => {
      ce(s, "stroke-width", n()), ce(s, "d", `M${r()[0] / 2} 0 V${r()[1]} M0 ${r()[1] / 2} H${r()[0]}`), kt(s, 0, bn(a));
    },
    [
      () => Et([
        "svelte-flow__background-pattern",
        o(),
        i()
      ])
    ],
    pe
  ), L(e, s), fe({
    get lineWidth() {
      return n();
    },
    set lineWidth(a) {
      n(a), y();
    },
    get dimensions() {
      return r();
    },
    set dimensions(a) {
      r(a), y();
    },
    get variant() {
      return o();
    },
    set variant(a) {
      o(a), y();
    },
    get class() {
      return i();
    },
    set class(a) {
      i(a), y();
    }
  });
}
ae(
  ed,
  {
    lineWidth: {},
    dimensions: {},
    variant: {},
    class: {}
  },
  [],
  [],
  !0
);
const ap = {
  [Gn.Dots]: 1,
  [Gn.Lines]: 1,
  [Gn.Cross]: 6
};
var lp = /* @__PURE__ */ _e('<svg data-testid="svelte-flow__background"><pattern patternUnits="userSpaceOnUse"><!></pattern><rect x="0" y="0" width="100%" height="100%"></rect></svg>');
const up = {
  hash: "svelte-1r7pe8d",
  code: ".svelte-flow__background.svelte-1r7pe8d {position:absolute;width:100%;height:100%;top:0;left:0;}"
};
function td(e, t) {
  de(t, !1), Je(e, up);
  const [n, r] = tt(), o = () => Q(b, "$flowId", n), i = () => Q(v, "$viewport", n), s = re(), a = re(), l = re(), u = re(), c = re();
  let f = w(t, "id", 12, void 0), d = w(t, "variant", 28, () => Gn.Dots), g = w(t, "gap", 12, 20), p = w(t, "size", 12, 1), x = w(t, "lineWidth", 12, 1), C = w(t, "bgColor", 12, void 0), $ = w(t, "patternColor", 12, void 0), m = w(t, "patternClass", 12, void 0), _ = w(t, "class", 12, "");
  const { viewport: v, flowId: b } = Ue(), N = p() || ap[d()], E = d() === Gn.Dots, M = d() === Gn.Cross, D = Array.isArray(g()) ? g() : [g(), g()];
  he(
    () => (o(), j(f())),
    () => {
      U(s, `background-pattern-${o()}-${f() ? f() : ""}`);
    }
  ), he(() => i(), () => {
    U(a, [
      D[0] * i().zoom || 1,
      D[1] * i().zoom || 1
    ]);
  }), he(() => i(), () => {
    U(l, N * i().zoom);
  }), he(() => (h(l), h(a)), () => {
    U(u, M ? [h(l), h(l)] : h(a));
  }), he(
    () => (h(l), h(u)),
    () => {
      U(c, E ? [
        h(l) / 2,
        h(l) / 2
      ] : [
        h(u)[0] / 2,
        h(u)[1] / 2
      ]);
    }
  ), gt(), He();
  var V = lp(), A = X(V), O = X(A);
  {
    var R = (P) => {
      const H = /* @__PURE__ */ pe(() => h(l) / 2);
      Qc(P, {
        get radius() {
          return h(H);
        },
        get class() {
          return m();
        }
      });
    }, S = (P) => {
      ed(P, {
        get dimensions() {
          return h(u);
        },
        get variant() {
          return d();
        },
        get lineWidth() {
          return x();
        },
        get class() {
          return m();
        }
      });
    };
    ke(O, (P) => {
      E ? P(R) : P(S, !1);
    });
  }
  Z(A);
  var T = z(A);
  Z(V), Ee(
    (P) => {
      kt(V, 0, bn(P), "svelte-1r7pe8d"), st(V, "--xy-background-color-props", C()), st(V, "--xy-background-pattern-color-props", $()), ce(A, "id", h(s)), ce(A, "x", i().x % h(a)[0]), ce(A, "y", i().y % h(a)[1]), ce(A, "width", h(a)[0]), ce(A, "height", h(a)[1]), ce(A, "patternTransform", `translate(-${h(c)[0]},-${h(c)[1]})`), ce(T, "fill", `url(#${h(s)})`);
    },
    [
      () => Et(["svelte-flow__background", _()])
    ],
    pe
  ), L(e, V);
  var k = fe({
    get id() {
      return f();
    },
    set id(P) {
      f(P), y();
    },
    get variant() {
      return d();
    },
    set variant(P) {
      d(P), y();
    },
    get gap() {
      return g();
    },
    set gap(P) {
      g(P), y();
    },
    get size() {
      return p();
    },
    set size(P) {
      p(P), y();
    },
    get lineWidth() {
      return x();
    },
    set lineWidth(P) {
      x(P), y();
    },
    get bgColor() {
      return C();
    },
    set bgColor(P) {
      C(P), y();
    },
    get patternColor() {
      return $();
    },
    set patternColor(P) {
      $(P), y();
    },
    get patternClass() {
      return m();
    },
    set patternClass(P) {
      m(P), y();
    },
    get class() {
      return _();
    },
    set class(P) {
      _(P), y();
    }
  });
  return r(), k;
}
ae(
  td,
  {
    id: {},
    variant: {},
    gap: {},
    size: {},
    lineWidth: {},
    bgColor: {},
    patternColor: {},
    patternClass: {},
    class: {}
  },
  [],
  [],
  !0
);
var cp = /* @__PURE__ */ _e("<rect></rect>");
function nd(e, t) {
  de(t, !1);
  let n = w(t, "x", 12), r = w(t, "y", 12), o = w(t, "width", 12, 0), i = w(t, "height", 12, 0), s = w(t, "borderRadius", 12, 5), a = w(t, "color", 12, void 0), l = w(t, "shapeRendering", 12), u = w(t, "strokeColor", 12, void 0), c = w(t, "strokeWidth", 12, 2), f = w(t, "selected", 12, !1), d = w(t, "class", 12, "");
  He();
  var g = cp();
  let p;
  return Ee(
    (x) => {
      p = kt(g, 0, bn(x), null, p, { selected: f() }), ce(g, "x", n()), ce(g, "y", r()), ce(g, "rx", s()), ce(g, "ry", s()), ce(g, "width", o()), ce(g, "height", i()), ce(g, "style", `${a() ? `fill: ${a()};` : ""}${u() ? `stroke: ${u()};` : ""}${c() ? `stroke-width: ${c()};` : ""}`), ce(g, "shape-rendering", l());
    },
    [
      () => Et(["svelte-flow__minimap-node", d()])
    ],
    pe
  ), L(e, g), fe({
    get x() {
      return n();
    },
    set x(x) {
      n(x), y();
    },
    get y() {
      return r();
    },
    set y(x) {
      r(x), y();
    },
    get width() {
      return o();
    },
    set width(x) {
      o(x), y();
    },
    get height() {
      return i();
    },
    set height(x) {
      i(x), y();
    },
    get borderRadius() {
      return s();
    },
    set borderRadius(x) {
      s(x), y();
    },
    get color() {
      return a();
    },
    set color(x) {
      a(x), y();
    },
    get shapeRendering() {
      return l();
    },
    set shapeRendering(x) {
      l(x), y();
    },
    get strokeColor() {
      return u();
    },
    set strokeColor(x) {
      u(x), y();
    },
    get strokeWidth() {
      return c();
    },
    set strokeWidth(x) {
      c(x), y();
    },
    get selected() {
      return f();
    },
    set selected(x) {
      f(x), y();
    },
    get class() {
      return d();
    },
    set class(x) {
      d(x), y();
    }
  });
}
ae(
  nd,
  {
    x: {},
    y: {},
    width: {},
    height: {},
    borderRadius: {},
    color: {},
    shapeRendering: {},
    strokeColor: {},
    strokeWidth: {},
    selected: {},
    class: {}
  },
  [],
  [],
  !0
);
function cs(e, t) {
  const n = q0({
    domNode: e,
    panZoom: t.panZoom,
    getTransform: () => {
      const o = q(t.viewport);
      return [o.x, o.y, o.zoom];
    },
    getViewScale: t.getViewScale
  });
  function r(o) {
    n.update({
      translateExtent: o.translateExtent,
      width: o.width,
      height: o.height,
      inversePan: o.inversePan,
      zoomStep: o.zoomStep,
      pannable: o.pannable,
      zoomable: o.zoomable
    });
  }
  return {
    update: r,
    destroy() {
      n.destroy();
    }
  };
}
const ds = (e) => e instanceof Function ? e : () => e;
var dp = /* @__PURE__ */ _e("<title> </title>"), fp = /* @__PURE__ */ _e('<svg class="svelte-flow__minimap-svg" role="img"><!><!><path class="svelte-flow__minimap-mask" fill-rule="evenodd" pointer-events="none"></path></svg>');
function rd(e, t) {
  de(t, !1);
  const [n, r] = tt(), o = () => Q(Xe, "$flowId", n), i = () => Q(se, "$viewport", n), s = () => Q(Te, "$containerWidth", n), a = () => Q(Ae, "$containerHeight", n), l = () => Q(G, "$nodeLookup", n), u = () => Q(ze, "$nodes", n), c = () => Q(te, "$panZoom", n), f = () => Q(Fe, "$translateExtent", n), d = re(), g = re(), p = re(), x = re(), C = re(), $ = re(), m = re(), _ = re(), v = re(), b = re(), N = re(), E = re(), M = re();
  let D = w(t, "position", 12, "bottom-right"), V = w(t, "ariaLabel", 12, "Mini map"), A = w(t, "nodeStrokeColor", 12, "transparent"), O = w(t, "nodeColor", 12, void 0), R = w(t, "nodeClass", 12, ""), S = w(t, "nodeBorderRadius", 12, 5), T = w(t, "nodeStrokeWidth", 12, 2), k = w(t, "bgColor", 12, void 0), P = w(t, "maskColor", 12, void 0), H = w(t, "maskStrokeColor", 12, void 0), I = w(t, "maskStrokeWidth", 12, void 0), B = w(t, "width", 12, void 0), F = w(t, "height", 12, void 0), K = w(t, "pannable", 12, !0), ie = w(t, "zoomable", 12, !0), ee = w(t, "inversePan", 12, void 0), W = w(t, "zoomStep", 12, void 0), ue = w(t, "style", 12, ""), me = w(t, "class", 12, "");
  const Ce = 200, ge = 150, {
    nodes: ze,
    nodeLookup: G,
    viewport: se,
    width: Te,
    height: Ae,
    flowId: Xe,
    panZoom: te,
    translateExtent: Fe
  } = Ue(), Le = O() === void 0 ? void 0 : ds(O()), Qe = ds(A()), oe = ds(R()), ve = (
    // @ts-expect-error - TS doesn't know about chrome
    typeof window > "u" || window.chrome ? "crispEdges" : "geometricPrecision"
  ), xe = `svelte-flow__minimap-desc-${o()}`;
  let Oe = re(h(d));
  const ct = () => h($);
  he(
    () => (i(), s(), a()),
    () => {
      U(d, {
        x: -i().x / i().zoom,
        y: -i().y / i().zoom,
        width: s() / i().zoom,
        height: a() / i().zoom
      });
    }
  ), he(
    () => (l(), h(d), u()),
    () => {
      U(Oe, l().size > 0 ? nc(No(l()), h(d)) : h(d)), u();
    }
  ), he(() => j(B()), () => {
    U(g, B() ?? Ce);
  }), he(() => j(F()), () => {
    U(p, F() ?? ge);
  }), he(
    () => (h(Oe), h(g)),
    () => {
      U(x, h(Oe).width / h(g));
    }
  ), he(
    () => (h(Oe), h(p)),
    () => {
      U(C, h(Oe).height / h(p));
    }
  ), he(
    () => (h(x), h(C)),
    () => {
      U($, Math.max(h(x), h(C)));
    }
  ), he(() => (h($), h(g)), () => {
    U(m, h($) * h(g));
  }), he(
    () => (h($), h(p)),
    () => {
      U(_, h($) * h(p));
    }
  ), he(() => h($), () => {
    U(v, 5 * h($));
  }), he(
    () => (h(Oe), h(m), h(v)),
    () => {
      U(b, h(Oe).x - (h(m) - h(Oe).width) / 2 - h(v));
    }
  ), he(
    () => (h(Oe), h(_), h(v)),
    () => {
      U(N, h(Oe).y - (h(_) - h(Oe).height) / 2 - h(v));
    }
  ), he(() => (h(m), h(v)), () => {
    U(E, h(m) + h(v) * 2);
  }), he(() => (h(_), h(v)), () => {
    U(M, h(_) + h(v) * 2);
  }), gt(), He();
  const lt = /* @__PURE__ */ pe(() => ue() + (k() ? `;--xy-minimap-background-color-props:${k()}` : "")), J = /* @__PURE__ */ pe(() => Et(["svelte-flow__minimap", me()]));
  Ho(e, {
    get position() {
      return D();
    },
    get style() {
      return h(lt);
    },
    get class() {
      return h(J);
    },
    "data-testid": "svelte-flow__minimap",
    children: (le, fn) => {
      var Ut = et(), gn = be(Ut);
      {
        var Ne = (rt) => {
          var ye = fp();
          ce(ye, "aria-labelledby", xe);
          var ot = X(ye);
          {
            var at = (At) => {
              var St = dp();
              ce(St, "id", xe);
              var hn = X(St, !0);
              Z(St), Ee(() => Rt(hn, V())), L(At, St);
            };
            ke(ot, (At) => {
              V() && At(at);
            });
          }
          var Xt = z(ot);
          Yt(Xt, 1, u, (At) => At.id, (At, St) => {
            var hn = et();
            const jt = /* @__PURE__ */ pe(() => l().get(h(St).id));
            var ft = be(hn);
            {
              var ji = (nr) => {
                const Jt = /* @__PURE__ */ pe(() => tr(h(jt))), Io = /* @__PURE__ */ pe(() => Le == null ? void 0 : Le(h(jt))), zo = /* @__PURE__ */ pe(() => Qe(h(jt))), Ro = /* @__PURE__ */ pe(() => oe(h(jt)));
                nd(nr, ut(
                  {
                    get x() {
                      return h(jt).internals.positionAbsolute.x;
                    },
                    get y() {
                      return h(jt).internals.positionAbsolute.y;
                    }
                  },
                  () => h(Jt),
                  {
                    get selected() {
                      return h(jt).selected;
                    },
                    get color() {
                      return h(Io);
                    },
                    get borderRadius() {
                      return S();
                    },
                    get strokeColor() {
                      return h(zo);
                    },
                    get strokeWidth() {
                      return T();
                    },
                    shapeRendering: ve,
                    get class() {
                      return h(Ro);
                    }
                  }
                ));
              };
              ke(ft, (nr) => {
                h(jt) && oc(h(jt)) && nr(ji);
              });
            }
            L(At, hn);
          });
          var Kr = z(Xt);
          Z(ye), vt(ye, (At, St) => cs == null ? void 0 : cs(At, St), () => ({
            panZoom: c(),
            viewport: se,
            getViewScale: ct,
            translateExtent: f(),
            width: s(),
            height: a(),
            inversePan: ee(),
            zoomStep: W(),
            pannable: K(),
            zoomable: ie()
          })), Ee(() => {
            ce(ye, "width", h(g)), ce(ye, "height", h(p)), ce(ye, "viewBox", `${h(b) ?? ""} ${h(N) ?? ""} ${h(E) ?? ""} ${h(M) ?? ""}`), st(ye, "--xy-minimap-mask-background-color-props", P()), st(ye, "--xy-minimap-mask-stroke-color-props", H()), st(ye, "--xy-minimap-mask-stroke-width-props", I() ? I() * h($) : void 0), ce(Kr, "d", `M${h(b) - h(v)},${h(N) - h(v)}h${h(E) + h(v) * 2}v${h(M) + h(v) * 2}h${-h(E) - h(v) * 2}z
      M${h(d).x ?? ""},${h(d).y ?? ""}h${h(d).width ?? ""}v${h(d).height ?? ""}h${-h(d).width}z`);
          }), L(rt, ye);
        };
        ke(gn, (rt) => {
          c() && rt(Ne);
        });
      }
      L(le, Ut);
    },
    $$slots: { default: !0 }
  });
  var Re = fe({
    get position() {
      return D();
    },
    set position(le) {
      D(le), y();
    },
    get ariaLabel() {
      return V();
    },
    set ariaLabel(le) {
      V(le), y();
    },
    get nodeStrokeColor() {
      return A();
    },
    set nodeStrokeColor(le) {
      A(le), y();
    },
    get nodeColor() {
      return O();
    },
    set nodeColor(le) {
      O(le), y();
    },
    get nodeClass() {
      return R();
    },
    set nodeClass(le) {
      R(le), y();
    },
    get nodeBorderRadius() {
      return S();
    },
    set nodeBorderRadius(le) {
      S(le), y();
    },
    get nodeStrokeWidth() {
      return T();
    },
    set nodeStrokeWidth(le) {
      T(le), y();
    },
    get bgColor() {
      return k();
    },
    set bgColor(le) {
      k(le), y();
    },
    get maskColor() {
      return P();
    },
    set maskColor(le) {
      P(le), y();
    },
    get maskStrokeColor() {
      return H();
    },
    set maskStrokeColor(le) {
      H(le), y();
    },
    get maskStrokeWidth() {
      return I();
    },
    set maskStrokeWidth(le) {
      I(le), y();
    },
    get width() {
      return B();
    },
    set width(le) {
      B(le), y();
    },
    get height() {
      return F();
    },
    set height(le) {
      F(le), y();
    },
    get pannable() {
      return K();
    },
    set pannable(le) {
      K(le), y();
    },
    get zoomable() {
      return ie();
    },
    set zoomable(le) {
      ie(le), y();
    },
    get inversePan() {
      return ee();
    },
    set inversePan(le) {
      ee(le), y();
    },
    get zoomStep() {
      return W();
    },
    set zoomStep(le) {
      W(le), y();
    },
    get style() {
      return ue();
    },
    set style(le) {
      ue(le), y();
    },
    get class() {
      return me();
    },
    set class(le) {
      me(le), y();
    }
  });
  return r(), Re;
}
ae(
  rd,
  {
    position: {},
    ariaLabel: {},
    nodeStrokeColor: {},
    nodeColor: {},
    nodeClass: {},
    nodeBorderRadius: {},
    nodeStrokeWidth: {},
    bgColor: {},
    maskColor: {},
    maskStrokeColor: {},
    maskStrokeWidth: {},
    width: {},
    height: {},
    pannable: {},
    zoomable: {},
    inversePan: {},
    zoomStep: {},
    style: {},
    class: {}
  },
  [],
  [],
  !0
);
const Pl = (e) => f0(e);
function Dt() {
  const { zoomIn: e, zoomOut: t, fitView: n, onbeforedelete: r, snapGrid: o, viewport: i, width: s, height: a, minZoom: l, maxZoom: u, panZoom: c, nodes: f, edges: d, domNode: g, nodeLookup: p, nodeOrigin: x, edgeLookup: C, connectionLookup: $ } = Ue(), m = (b) => {
    var V, A;
    const N = q(p), E = Pl(b) ? b : N.get(b.id), M = E.parentId ? p0(E.position, E.measured, E.parentId, N, q(x)) : E.position, D = {
      ...E,
      position: M,
      width: ((V = E.measured) == null ? void 0 : V.width) ?? E.width,
      height: ((A = E.measured) == null ? void 0 : A.height) ?? E.height
    };
    return Lr(D);
  }, _ = (b, N, E = { replace: !1 }) => {
    var V;
    const M = (V = q(p).get(b)) == null ? void 0 : V.internals.userNode;
    if (!M)
      return;
    const D = typeof N == "function" ? N(M) : N;
    E.replace ? f.update((A) => A.map((O) => O.id === b ? Pl(D) ? D : { ...O, ...D } : O)) : (Object.assign(M, D), f.update((A) => A));
  }, v = (b) => q(p).get(b);
  return {
    zoomIn: e,
    zoomOut: t,
    getInternalNode: v,
    getNode: (b) => {
      var N;
      return (N = v(b)) == null ? void 0 : N.internals.userNode;
    },
    getNodes: (b) => b === void 0 ? q(f) : Nl(q(p), b),
    getEdge: (b) => q(C).get(b),
    getEdges: (b) => b === void 0 ? q(d) : Nl(q(C), b),
    setZoom: (b, N) => {
      const E = q(c);
      return E ? E.scaleTo(b, { duration: N == null ? void 0 : N.duration }) : Promise.resolve(!1);
    },
    getZoom: () => q(i).zoom,
    setViewport: async (b, N) => {
      const E = q(i), M = q(c);
      return M ? (await M.setViewport({
        x: b.x ?? E.x,
        y: b.y ?? E.y,
        zoom: b.zoom ?? E.zoom
      }, { duration: N == null ? void 0 : N.duration }), Promise.resolve(!0)) : Promise.resolve(!1);
    },
    getViewport: () => q(i),
    setCenter: async (b, N, E) => {
      const M = typeof (E == null ? void 0 : E.zoom) < "u" ? E.zoom : q(u), D = q(c);
      return D ? (await D.setViewport({
        x: q(s) / 2 - b * M,
        y: q(a) / 2 - N * M,
        zoom: M
      }, { duration: E == null ? void 0 : E.duration }), Promise.resolve(!0)) : Promise.resolve(!1);
    },
    fitView: n,
    fitBounds: async (b, N) => {
      const E = q(c);
      if (!E)
        return Promise.resolve(!1);
      const M = ua(b, q(s), q(a), q(l), q(u), (N == null ? void 0 : N.padding) ?? 0.1);
      return await E.setViewport(M, { duration: N == null ? void 0 : N.duration }), Promise.resolve(!0);
    },
    getIntersectingNodes: (b, N = !0, E) => {
      const M = fl(b), D = M ? b : m(b);
      return D ? (E || q(f)).filter((V) => {
        const A = q(p).get(V.id);
        if (!A || !M && V.id === b.id)
          return !1;
        const O = Lr(A), R = yo(O, D);
        return N && R > 0 || R >= D.width * D.height;
      }) : [];
    },
    isNodeIntersecting: (b, N, E = !0) => {
      const D = fl(b) ? b : m(b);
      if (!D)
        return !1;
      const V = yo(D, N);
      return E && V > 0 || V >= D.width * D.height;
    },
    deleteElements: async ({ nodes: b = [], edges: N = [] }) => {
      const { nodes: E, edges: M } = await Qu({
        nodesToRemove: b,
        edgesToRemove: N,
        nodes: q(f),
        edges: q(d),
        onBeforeDelete: q(r)
      });
      return E && f.update((D) => D.filter((V) => !E.some(({ id: A }) => A === V.id))), M && d.update((D) => D.filter((V) => !M.some(({ id: A }) => A === V.id))), {
        deletedNodes: E,
        deletedEdges: M
      };
    },
    screenToFlowPosition: (b, N = { snapToGrid: !0 }) => {
      const E = q(g);
      if (!E)
        return b;
      const M = N.snapToGrid ? q(o) : !1, { x: D, y: V, zoom: A } = q(i), { x: O, y: R } = E.getBoundingClientRect(), S = {
        x: b.x - O,
        y: b.y - R
      };
      return Mo(S, [D, V, A], M !== null, M || [1, 1]);
    },
    /**
     *
     * @param position
     * @returns
     */
    flowToScreenPosition: (b) => {
      const N = q(g);
      if (!N)
        return b;
      const { x: E, y: M, zoom: D } = q(i), { x: V, y: A } = N.getBoundingClientRect(), O = rc(b, [E, M, D]);
      return {
        x: O.x + V,
        y: O.y + A
      };
    },
    toObject: () => ({
      nodes: q(f).map((b) => ({
        ...b,
        // we want to make sure that changes to the nodes object that gets returned by toObject
        // do not affect the nodes object
        position: { ...b.position },
        data: { ...b.data }
      })),
      edges: q(d).map((b) => ({ ...b })),
      viewport: { ...q(i) }
    }),
    updateNode: _,
    updateNodeData: (b, N, E) => {
      var V;
      const M = (V = q(p).get(b)) == null ? void 0 : V.internals.userNode;
      if (!M)
        return;
      const D = typeof N == "function" ? N(M) : N;
      M.data = E != null && E.replace ? D : { ...M.data, ...D }, f.update((A) => A);
    },
    getNodesBounds: (b) => {
      const N = q(p), E = q(x);
      return g0(b, { nodeLookup: N, nodeOrigin: E });
    },
    getHandleConnections: ({ type: b, id: N, nodeId: E }) => {
      var M;
      return Array.from(((M = q($).get(`${E}-${b}-${N ?? null}`)) == null ? void 0 : M.values()) ?? []);
    },
    viewport: i
  };
}
function Nl(e, t) {
  var r;
  const n = [];
  for (const o of t) {
    const i = e.get(o);
    if (i) {
      const s = "internals" in i ? (r = i.internals) == null ? void 0 : r.userNode : i;
      n.push(s);
    }
  }
  return n;
}
var gp = /* @__PURE__ */ ne('<div class="svelte-flow__node-toolbar"><!></div>');
function od(e, t) {
  de(t, !1);
  const [n, r] = tt(), o = () => Q(_, "$nodes", n), i = () => Q(m, "$nodeLookup", n), s = () => Q($, "$viewport", n), a = () => Q(C, "$domNode", n), l = re(), u = re(), c = re();
  let f = w(t, "nodeId", 12, void 0), d = w(t, "position", 12, void 0), g = w(t, "align", 12, void 0), p = w(t, "offset", 12, void 0), x = w(t, "isVisible", 12, void 0);
  const { domNode: C, viewport: $, nodeLookup: m, nodes: _ } = Ue(), { getNodesBounds: v } = Dt(), b = ar("svelteflow__node_id");
  let N = re(), E = re([]), M = p() !== void 0 ? p() : 10, D = d() !== void 0 ? d() : $e.Top, V = g() !== void 0 ? g() : "center";
  he(
    () => (o(), j(f()), i()),
    () => {
      o();
      const T = Array.isArray(f()) ? f() : [f() || b];
      U(E, T.reduce(
        (k, P) => {
          const H = i().get(P);
          return H && k.push(H), k;
        },
        []
      ));
    }
  ), he(
    () => (h(E), s()),
    () => {
      const T = v(h(E));
      T && U(N, T0(T, s(), D, M, V));
    }
  ), he(() => h(E), () => {
    U(l, h(E).length === 0 ? 1 : Math.max(...h(E).map((T) => (T.internals.z || 5) + 1)));
  }), he(() => o(), () => {
    U(u, o().filter((T) => T.selected).length);
  }), he(
    () => (j(x()), h(E), h(u)),
    () => {
      U(c, typeof x() == "boolean" ? x() : h(E).length === 1 && h(E)[0].selected && h(u) === 1);
    }
  ), gt(), He();
  var A = et(), O = be(A);
  {
    var R = (T) => {
      var k = gp(), P = X(k);
      pt(P, t, "default", {}), Z(k), vt(k, (H, I) => kr == null ? void 0 : kr(H, I), () => ({ domNode: a() })), Ee(
        (H) => {
          ce(k, "data-id", H), st(k, "position", "absolute"), st(k, "transform", h(N)), st(k, "z-index", h(l));
        },
        [
          () => h(E).reduce((H, I) => `${H}${I.id} `, "").trim()
        ],
        pe
      ), L(T, k);
    };
    ke(O, (T) => {
      a() && h(c) && h(E) && T(R);
    });
  }
  L(e, A);
  var S = fe({
    get nodeId() {
      return f();
    },
    set nodeId(T) {
      f(T), y();
    },
    get position() {
      return d();
    },
    set position(T) {
      d(T), y();
    },
    get align() {
      return g();
    },
    set align(T) {
      g(T), y();
    },
    get offset() {
      return p();
    },
    set offset(T) {
      p(T), y();
    },
    get isVisible() {
      return x();
    },
    set isVisible(T) {
      x(T), y();
    }
  });
  return r(), S;
}
ae(
  od,
  {
    nodeId: {},
    position: {},
    align: {},
    offset: {},
    isVisible: {}
  },
  ["default"],
  [],
  !0
);
function pr(e) {
  const { nodes: t, nodeLookup: n } = Ue();
  let r = [], o = !0;
  return Kn([t, n], ([, i], s) => {
    var c;
    const a = [], l = Array.isArray(e), u = l ? e : [e];
    for (const f of u) {
      const d = (c = i.get(f)) == null ? void 0 : c.internals.userNode;
      d && a.push({
        id: d.id,
        type: d.type,
        data: d.data
      });
    }
    (!z0(a, r) || o) && (r = a, s(l ? a : a[0] ?? null), o = !1);
  });
}
const Ml = "tinyflow-component";
class yw {
  constructor(t) {
    wt(this, "options");
    wt(this, "rootEl");
    wt(this, "svelteFlowInstance");
    if (typeof t.element != "string" && !(t.element instanceof Element))
      throw new Error("element must be a string or Element");
    this._setOptions(t), this._init();
  }
  _init() {
    if (typeof this.options.element == "string") {
      if (this.rootEl = document.querySelector(this.options.element), !this.rootEl)
        throw new Error(
          `element not found by document.querySelector('${this.options.element}')`
        );
    } else if (this.options.element instanceof Element)
      this.rootEl = this.options.element;
    else
      throw new Error("element must be a string or Element");
    const t = document.createElement(Ml);
    t.style.display = "block", t.style.width = "100%", t.style.height = "100%", t.classList.add("tf-theme-light"), t.options = this.options, t.onInit = (n) => {
      this.svelteFlowInstance = n;
    }, this.rootEl.appendChild(t);
  }
  _setOptions(t) {
    this.options = {
      ...t
    };
  }
  getOptions() {
    return this.options;
  }
  getData() {
    return this.svelteFlowInstance.toObject();
  }
  setData(t) {
    this.options.data = t;
    const n = document.createElement(Ml);
    n.style.display = "block", n.style.width = "100%", n.style.height = "100%", n.classList.add("tf-theme-light"), n.options = this.options, n.onInit = (r) => {
      this.svelteFlowInstance = r;
    }, this.destroy(), this.rootEl.appendChild(n);
  }
  destroy() {
    for (; this.rootEl.firstChild; )
      this.rootEl.removeChild(this.rootEl.firstChild);
  }
}
const hp = () => {
  const e = we([]), t = we([]), n = we({ x: 250, y: 100, zoom: 1 });
  return {
    nodes: e,
    edges: t,
    viewport: n,
    init: (r, o) => {
      e.set(r), t.set(o);
    },
    addNode: (r) => {
      e.update((o) => [...o, r]);
    },
    removeNode: (r) => {
      e.update((o) => o.filter((i) => i.id !== r));
    },
    updateNode: (r, o) => {
      e.update((i) => i.map((s) => s.id === r ? o : s));
    },
    updateNodeData: (r, o) => {
      e.update(
        (i) => i.map((s) => s.id === r ? { ...s, data: { ...s.data, ...o } } : s)
      );
    },
    selectNodeOnly: (r) => {
      e.update(
        (o) => o.map(
          (i) => i.id === r ? { ...i, selected: !0 } : { ...i, selected: !1 }
        )
      );
    },
    addEdge: (r) => {
      t.update((o) => [...o, r]);
    },
    removeEdge: (r) => {
      t.update((o) => o.filter((i) => i.id !== r));
    },
    updateEdge: (r, o) => {
      t.update((i) => i.map((s) => s.id === r ? o : s));
    },
    updateEdgeData: (r, o) => {
      t.update((i) => i.map((s) => s.id === r ? { ...s, data: o } : s));
    }
  };
}, ei = hp();
var vp = /* @__PURE__ */ ne("<button><!></button>");
function Ke(e, t) {
  de(t, !0);
  const n = w(t, "children", 7), r = /* @__PURE__ */ yt(t, [
    "$$slots",
    "$$events",
    "$$legacy",
    "$$host",
    "children"
  ]);
  var o = vp();
  let i;
  var s = X(o);
  return lr(s, () => n() ?? dt), Z(o), Ee(() => i = on(o, i, {
    type: "button",
    ...r,
    class: `tf-btn nopan nodrag ${t.class ?? ""}`
  })), L(e, o), fe({
    get children() {
      return n();
    },
    set children(a) {
      n(a), y();
    }
  });
}
ae(Ke, { children: {} }, [], [], !0);
var pp = /* @__PURE__ */ ne("<input>");
function id(e, t) {
  de(t, !0);
  const n = /* @__PURE__ */ yt(t, ["$$slots", "$$events", "$$legacy", "$$host"]);
  var r = pp();
  io(r);
  let o;
  Ee(() => o = on(r, o, {
    type: "checkbox",
    ...n,
    class: `tf-checkbox nopan nodrag ${t.class ?? ""}`
  })), L(e, r), fe();
}
ae(id, {}, [], [], !0);
var mp = /* @__PURE__ */ ne("<input>");
function xt(e, t) {
  de(t, !0);
  const n = /* @__PURE__ */ yt(t, ["$$slots", "$$events", "$$legacy", "$$host"]);
  var r = mp();
  io(r);
  let o;
  Ee(() => o = on(r, o, {
    type: "text",
    ...n,
    class: `tf-input  nopan nodrag ${t.class ?? ""}`
  })), L(e, r), fe();
}
ae(xt, {}, [], [], !0);
var yp = /* @__PURE__ */ ne("<textarea></textarea>");
function $t(e, t) {
  de(t, !0);
  const n = /* @__PURE__ */ yt(t, ["$$slots", "$$events", "$$legacy", "$$host"]);
  var r = yp();
  l1(r);
  let o;
  Ee(() => o = on(r, o, {
    ...n,
    class: `tf-textarea nodrag ${t.class ?? ""}`
  })), L(e, r), fe();
}
ae($t, {}, [], [], !0);
var wp = /* @__PURE__ */ ne('<div role="button"><!></div>'), _p = /* @__PURE__ */ ne("<div></div>");
function sd(e, t) {
  const n = nt(t, [
    "children",
    "$$slots",
    "$$events",
    "$$legacy",
    "$$host"
  ]), r = nt(n, ["items", "onChange", "activeIndex"]);
  de(t, !1);
  let o = w(t, "items", 28, () => []), i = w(t, "onChange", 12, () => {
  }), s = w(t, "activeIndex", 12, 0);
  function a(c, f) {
    var d;
    s(f), (d = i()) == null || d(c, f);
  }
  He();
  var l = _p();
  let u;
  return Yt(l, 5, o, Li, (c, f, d) => {
    var g = wp();
    ce(g, "tabindex", d), g.__click = () => a(h(f), d), g.__keydown = ($) => {
      ($.key === "Enter" || $.key === " ") && ($.preventDefault(), a(h(f), d));
    };
    var p = X(g);
    {
      var x = ($) => {
        var m = Ie();
        Ee(() => Rt(m, h(f).label)), L($, m);
      }, C = ($) => {
        var m = et(), _ = be(m);
        lr(_, () => h(f).label ?? dt), L($, m);
      };
      ke(p, ($) => {
        typeof h(f).label == "string" ? $(x) : $(C, !1);
      });
    }
    Z(g), Ee(() => kt(g, 1, `tf-tabs-item ${(d === s() ? "active" : "") ?? ""}`)), L(c, g);
  }), Z(l), Ee(() => u = on(l, u, {
    ...r,
    class: `tf-tabs ${r.class ?? ""}`
  })), L(e, l), fe({
    get items() {
      return o();
    },
    set items(c) {
      o(c), y();
    },
    get onChange() {
      return i();
    },
    set onChange(c) {
      i(c), y();
    },
    get activeIndex() {
      return s();
    },
    set activeIndex(c) {
      s(c), y();
    }
  });
}
Ai(["click", "keydown"]);
ae(sd, { items: {}, onChange: {}, activeIndex: {} }, [], [], !0);
var xp = (e, t, n) => t(h(n)), bp = (e, t, n) => {
  (e.key === "Enter" || e.key === " ") && (e.preventDefault(), t(h(n)));
}, Cp = /* @__PURE__ */ ne('<span class="tf-collapse-item-title-icon"><!></span>'), kp = /* @__PURE__ */ ne('<div class="tf-collapse-item-description"><!></div>'), $p = /* @__PURE__ */ ne('<div class="tf-collapse-item-content"><!></div>'), Ep = /* @__PURE__ */ ne('<div class="tf-collapse-item"><div class="tf-collapse-item-title" role="button"><!> <!> <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M13.1717 12.0007L8.22192 7.05093L9.63614 5.63672L16.0001 12.0007L9.63614 18.3646L8.22192 16.9504L13.1717 12.0007Z"></path></svg></span></div> <!> <!></div>'), Sp = /* @__PURE__ */ ne("<div></div>");
const Pp = {
  hash: "svelte-1jfktzw",
  code: `\r
    /* 定义旋转的 CSS 类 */.rotate-90.svelte-1jfktzw {transform:rotate(90deg);transition:transform 0.3s ease;}`
};
function ad(e, t) {
  de(t, !0), Je(e, Pp);
  let n = w(t, "items", 7), r = w(t, "onChange", 7), o = w(t, "activeKeys", 31, () => Tt([]));
  function i(a) {
    var l;
    o().includes(a.key) ? o(o().filter((u) => u !== a.key)) : (o().push(a.key), o(o())), (l = r()) == null || l(a, o());
  }
  var s = Sp();
  return Yt(s, 21, n, Li, (a, l, u) => {
    var c = Ep(), f = X(c);
    ce(f, "tabindex", u), f.__click = [xp, i, l], f.__keydown = [bp, i, l];
    var d = X(f);
    {
      var g = (v) => {
        var b = Cp(), N = X(b);
        Fn(N, {
          get target() {
            return h(l).icon;
          }
        }), Z(b), L(v, b);
      };
      ke(d, (v) => {
        h(l).icon && v(g);
      });
    }
    var p = z(d, 2);
    Fn(p, {
      get target() {
        return h(l).title;
      }
    });
    var x = z(p, 2);
    Z(f);
    var C = z(f, 2);
    {
      var $ = (v) => {
        var b = kp(), N = X(b);
        Fn(N, {
          get target() {
            return h(l).description;
          }
        }), Z(b), L(v, b);
      };
      ke(C, (v) => {
        h(l).description && v($);
      });
    }
    var m = z(C, 2);
    {
      var _ = (v) => {
        var b = $p(), N = X(b);
        Fn(N, {
          get target() {
            return h(l).content;
          }
        }), Z(b), L(v, b);
      };
      ke(m, (v) => {
        o().includes(h(l).key) && v(_);
      });
    }
    Z(c), Ee((v) => kt(x, 1, `tf-collapse-item-title-arrow ${v ?? ""}`, "svelte-1jfktzw"), [
      () => o().includes(h(l).key) ? "rotate-90" : ""
    ]), L(a, c);
  }), Z(s), Ee(() => {
    ce(s, "style", t.style), kt(s, 1, `tf-collapse ${t.class ?? ""}`, "svelte-1jfktzw");
  }), L(e, s), fe({
    get items() {
      return n();
    },
    set items(a) {
      n(a), y();
    },
    get onChange() {
      return r();
    },
    set onChange(a) {
      r(a), y();
    },
    get activeKeys() {
      return o();
    },
    set activeKeys(a = []) {
      o(a), y();
    }
  });
}
Ai(["click", "keydown"]);
ae(ad, { items: {}, onChange: {}, activeKeys: {} }, [], [], !0);
function Fn(e, t) {
  de(t, !0);
  let n = w(t, "target", 7);
  typeof n() > "u" && n("undefined");
  var r = et(), o = be(r);
  {
    var i = (a) => {
      var l = et(), u = be(l);
      lr(u, () => n() ?? dt), L(a, l);
    }, s = (a) => {
      var l = et(), u = be(l);
      mu(u, n), L(a, l);
    };
    ke(o, (a) => {
      typeof n() == "function" ? a(i) : a(s, !1);
    });
  }
  return L(e, r), fe({
    get target() {
      return n();
    },
    set target(a) {
      n(a), y();
    }
  });
}
ae(Fn, { target: {} }, [], [], !0);
var Np = (e, t, n) => t(h(n)), Mp = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14L8 10H16L12 14Z"></path></svg>'), Tp = /* @__PURE__ */ ne('<div class="tf-select-content-children"><!></div>'), Hp = /* @__PURE__ */ ne('<button class="tf-select-content-item"><span><!></span> <!></button> <!>', 1), Vp = /* @__PURE__ */ ne('<div class="tf-select-content nopan nodrag"><!></div>'), Dp = /* @__PURE__ */ ne("<!> <!>", 1), Ap = /* @__PURE__ */ ne('<div class="tf-select-input-placeholder"> </div>'), Lp = /* @__PURE__ */ ne('<button><div class="tf-select-input-value"></div> <div class="tf-select-input-arrow"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.9999 13.1714L16.9497 8.22168L18.3639 9.63589L11.9999 15.9999L5.63599 9.63589L7.0502 8.22168L11.9999 13.1714Z"></path></svg></div></button>'), Op = /* @__PURE__ */ ne("<div><!></div>");
function sn(e, t) {
  de(t, !0);
  const n = (_, v = dt) => {
    var b = et(), N = be(b);
    Yt(N, 19, v, (E, M) => `${M}_${E.value}`, (E, M) => {
      var D = Hp(), V = be(D);
      V.__click = [Np, x, M];
      var A = X(V), O = X(A);
      {
        var R = (P) => {
          var H = Mp();
          L(P, H);
        };
        ke(O, (P) => {
          h(M).children && h(M).children.length > 0 && P(R);
        });
      }
      Z(A);
      var S = z(A, 2);
      Fn(S, {
        get target() {
          return h(M).label;
        }
      }), Z(V);
      var T = z(V, 2);
      {
        var k = (P) => {
          var H = Tp(), I = X(H);
          n(I, () => h(M).children), Z(H), L(P, H);
        };
        ke(T, (P) => {
          h(M).children && h(M).children.length > 0 && (l() || c().includes(h(M).value)) && P(k);
        });
      }
      L(E, D);
    }), L(_, b);
  };
  let r = w(t, "items", 7), o = w(t, "onExpand", 7), i = w(t, "onSelect", 7), s = w(t, "value", 23, () => []), a = w(t, "defaultValue", 23, () => []), l = w(t, "expandAll", 7, !0), u = w(t, "multiple", 7, !1), c = w(t, "expandValue", 23, () => []), f = w(t, "placeholder", 7), d = /* @__PURE__ */ yt(t, [
    "$$slots",
    "$$events",
    "$$legacy",
    "$$host",
    "items",
    "onExpand",
    "onSelect",
    "value",
    "defaultValue",
    "expandAll",
    "multiple",
    "expandValue",
    "placeholder"
  ]), g = /* @__PURE__ */ Me(() => {
    const _ = [], v = (b) => {
      for (let N of b)
        s().length > 0 ? s().includes(N.value) && _.push(N) : a().includes(N.value) && _.push(N), N.children && N.children.length > 0 && v(N.children);
    };
    return v(r()), _;
  }), p;
  function x(_) {
    var v, b;
    if (_.children && _.children.length > 0) {
      (v = o()) == null || v(_);
      return;
    } else
      p == null || p.hide(), (b = i()) == null || b(_);
  }
  var C = Op();
  let $;
  var m = X(C);
  return An(
    Lo(m, {
      floating: (v) => {
        var b = Vp(), N = X(b);
        n(N, r), Z(b), L(v, b);
      },
      children: (v, b) => {
        var N = Lp();
        let E;
        var M = X(N);
        Yt(
          M,
          23,
          () => h(g),
          (D, V) => `${V}_${D.value}`,
          (D, V, A) => {
            var O = et(), R = be(O);
            {
              var S = (k) => {
                var P = et(), H = be(P);
                {
                  var I = (B) => {
                    Fn(B, {
                      get target() {
                        return h(V).label;
                      }
                    });
                  };
                  ke(H, (B) => {
                    h(A) === 0 && B(I);
                  });
                }
                L(k, P);
              }, T = (k) => {
                var P = Dp(), H = be(P);
                Fn(H, {
                  get target() {
                    return h(V).label;
                  }
                });
                var I = z(H, 2);
                {
                  var B = (F) => {
                    var K = Ie(",");
                    L(F, K);
                  };
                  ke(I, (F) => {
                    h(A) < h(g).length - 1 && F(B);
                  });
                }
                L(k, P);
              };
              ke(R, (k) => {
                u() ? k(T, !1) : k(S);
              });
            }
            L(D, O);
          },
          (D) => {
            var V = Ap(), A = X(V, !0);
            Z(V), Ee(() => Rt(A, f())), L(D, V);
          }
        ), Z(M), Se(2), Z(N), Ee(() => E = on(N, E, {
          class: "tf-select-input nopan nodrag",
          ...d
        })), L(v, N);
      },
      $$slots: { floating: !0, default: !0 }
    }),
    (v) => p = v,
    () => p
  ), Z(C), Ee(() => $ = on(C, $, {
    ...d,
    class: `tf-select ${d.class ?? ""}`
  })), L(e, C), fe({
    get items() {
      return r();
    },
    set items(_) {
      r(_), y();
    },
    get onExpand() {
      return o();
    },
    set onExpand(_) {
      o(_), y();
    },
    get onSelect() {
      return i();
    },
    set onSelect(_) {
      i(_), y();
    },
    get value() {
      return s();
    },
    set value(_ = []) {
      s(_), y();
    },
    get defaultValue() {
      return a();
    },
    set defaultValue(_ = []) {
      a(_), y();
    },
    get expandAll() {
      return l();
    },
    set expandAll(_ = !0) {
      l(_), y();
    },
    get multiple() {
      return u();
    },
    set multiple(_ = !1) {
      u(_), y();
    },
    get expandValue() {
      return c();
    },
    set expandValue(_ = []) {
      c(_), y();
    },
    get placeholder() {
      return f();
    },
    set placeholder(_) {
      f(_), y();
    }
  });
}
Ai(["click"]);
ae(
  sn,
  {
    items: {},
    onExpand: {},
    onSelect: {},
    value: {},
    defaultValue: {},
    expandAll: {},
    multiple: {},
    expandValue: {},
    placeholder: {}
  },
  [],
  [],
  !0
);
const _o = Math.min, Er = Math.max, bi = Math.round, mn = (e) => ({
  x: e,
  y: e
}), Ip = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
}, zp = {
  start: "end",
  end: "start"
};
function Ds(e, t, n) {
  return Er(e, _o(t, n));
}
function Vo(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function fr(e) {
  return e.split("-")[0];
}
function Do(e) {
  return e.split("-")[1];
}
function ld(e) {
  return e === "x" ? "y" : "x";
}
function va(e) {
  return e === "y" ? "height" : "width";
}
function Ir(e) {
  return ["top", "bottom"].includes(fr(e)) ? "y" : "x";
}
function pa(e) {
  return ld(Ir(e));
}
function Rp(e, t, n) {
  n === void 0 && (n = !1);
  const r = Do(e), o = pa(e), i = va(o);
  let s = o === "x" ? r === (n ? "end" : "start") ? "right" : "left" : r === "start" ? "bottom" : "top";
  return t.reference[i] > t.floating[i] && (s = Ci(s)), [s, Ci(s)];
}
function Bp(e) {
  const t = Ci(e);
  return [As(e), t, As(t)];
}
function As(e) {
  return e.replace(/start|end/g, (t) => zp[t]);
}
function Yp(e, t, n) {
  const r = ["left", "right"], o = ["right", "left"], i = ["top", "bottom"], s = ["bottom", "top"];
  switch (e) {
    case "top":
    case "bottom":
      return n ? t ? o : r : t ? r : o;
    case "left":
    case "right":
      return t ? i : s;
    default:
      return [];
  }
}
function Zp(e, t, n, r) {
  const o = Do(e);
  let i = Yp(fr(e), n === "start", r);
  return o && (i = i.map((s) => s + "-" + o), t && (i = i.concat(i.map(As)))), i;
}
function Ci(e) {
  return e.replace(/left|right|bottom|top/g, (t) => Ip[t]);
}
function Xp(e) {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...e
  };
}
function ud(e) {
  return typeof e != "number" ? Xp(e) : {
    top: e,
    right: e,
    bottom: e,
    left: e
  };
}
function ki(e) {
  const {
    x: t,
    y: n,
    width: r,
    height: o
  } = e;
  return {
    width: r,
    height: o,
    top: n,
    left: t,
    right: t + r,
    bottom: n + o,
    x: t,
    y: n
  };
}
function Tl(e, t, n) {
  let {
    reference: r,
    floating: o
  } = e;
  const i = Ir(t), s = pa(t), a = va(s), l = fr(t), u = i === "y", c = r.x + r.width / 2 - o.width / 2, f = r.y + r.height / 2 - o.height / 2, d = r[a] / 2 - o[a] / 2;
  let g;
  switch (l) {
    case "top":
      g = {
        x: c,
        y: r.y - o.height
      };
      break;
    case "bottom":
      g = {
        x: c,
        y: r.y + r.height
      };
      break;
    case "right":
      g = {
        x: r.x + r.width,
        y: f
      };
      break;
    case "left":
      g = {
        x: r.x - o.width,
        y: f
      };
      break;
    default:
      g = {
        x: r.x,
        y: r.y
      };
  }
  switch (Do(t)) {
    case "start":
      g[s] -= d * (n && u ? -1 : 1);
      break;
    case "end":
      g[s] += d * (n && u ? -1 : 1);
      break;
  }
  return g;
}
const Fp = async (e, t, n) => {
  const {
    placement: r = "bottom",
    strategy: o = "absolute",
    middleware: i = [],
    platform: s
  } = n, a = i.filter(Boolean), l = await (s.isRTL == null ? void 0 : s.isRTL(t));
  let u = await s.getElementRects({
    reference: e,
    floating: t,
    strategy: o
  }), {
    x: c,
    y: f
  } = Tl(u, r, l), d = r, g = {}, p = 0;
  for (let x = 0; x < a.length; x++) {
    const {
      name: C,
      fn: $
    } = a[x], {
      x: m,
      y: _,
      data: v,
      reset: b
    } = await $({
      x: c,
      y: f,
      initialPlacement: r,
      placement: d,
      strategy: o,
      middlewareData: g,
      rects: u,
      platform: s,
      elements: {
        reference: e,
        floating: t
      }
    });
    c = m ?? c, f = _ ?? f, g = {
      ...g,
      [C]: {
        ...g[C],
        ...v
      }
    }, b && p <= 50 && (p++, typeof b == "object" && (b.placement && (d = b.placement), b.rects && (u = b.rects === !0 ? await s.getElementRects({
      reference: e,
      floating: t,
      strategy: o
    }) : b.rects), {
      x: c,
      y: f
    } = Tl(u, d, l)), x = -1);
  }
  return {
    x: c,
    y: f,
    placement: d,
    strategy: o,
    middlewareData: g
  };
};
async function cd(e, t) {
  var n;
  t === void 0 && (t = {});
  const {
    x: r,
    y: o,
    platform: i,
    rects: s,
    elements: a,
    strategy: l
  } = e, {
    boundary: u = "clippingAncestors",
    rootBoundary: c = "viewport",
    elementContext: f = "floating",
    altBoundary: d = !1,
    padding: g = 0
  } = Vo(t, e), p = ud(g), C = a[d ? f === "floating" ? "reference" : "floating" : f], $ = ki(await i.getClippingRect({
    element: (n = await (i.isElement == null ? void 0 : i.isElement(C))) == null || n ? C : C.contextElement || await (i.getDocumentElement == null ? void 0 : i.getDocumentElement(a.floating)),
    boundary: u,
    rootBoundary: c,
    strategy: l
  })), m = f === "floating" ? {
    x: r,
    y: o,
    width: s.floating.width,
    height: s.floating.height
  } : s.reference, _ = await (i.getOffsetParent == null ? void 0 : i.getOffsetParent(a.floating)), v = await (i.isElement == null ? void 0 : i.isElement(_)) ? await (i.getScale == null ? void 0 : i.getScale(_)) || {
    x: 1,
    y: 1
  } : {
    x: 1,
    y: 1
  }, b = ki(i.convertOffsetParentRelativeRectToViewportRelativeRect ? await i.convertOffsetParentRelativeRectToViewportRelativeRect({
    elements: a,
    rect: m,
    offsetParent: _,
    strategy: l
  }) : m);
  return {
    top: ($.top - b.top + p.top) / v.y,
    bottom: (b.bottom - $.bottom + p.bottom) / v.y,
    left: ($.left - b.left + p.left) / v.x,
    right: (b.right - $.right + p.right) / v.x
  };
}
const Wp = (e) => ({
  name: "arrow",
  options: e,
  async fn(t) {
    const {
      x: n,
      y: r,
      placement: o,
      rects: i,
      platform: s,
      elements: a,
      middlewareData: l
    } = t, {
      element: u,
      padding: c = 0
    } = Vo(e, t) || {};
    if (u == null)
      return {};
    const f = ud(c), d = {
      x: n,
      y: r
    }, g = pa(o), p = va(g), x = await s.getDimensions(u), C = g === "y", $ = C ? "top" : "left", m = C ? "bottom" : "right", _ = C ? "clientHeight" : "clientWidth", v = i.reference[p] + i.reference[g] - d[g] - i.floating[p], b = d[g] - i.reference[g], N = await (s.getOffsetParent == null ? void 0 : s.getOffsetParent(u));
    let E = N ? N[_] : 0;
    (!E || !await (s.isElement == null ? void 0 : s.isElement(N))) && (E = a.floating[_] || i.floating[p]);
    const M = v / 2 - b / 2, D = E / 2 - x[p] / 2 - 1, V = _o(f[$], D), A = _o(f[m], D), O = V, R = E - x[p] - A, S = E / 2 - x[p] / 2 + M, T = Ds(O, S, R), k = !l.arrow && Do(o) != null && S !== T && i.reference[p] / 2 - (S < O ? V : A) - x[p] / 2 < 0, P = k ? S < O ? S - O : S - R : 0;
    return {
      [g]: d[g] + P,
      data: {
        [g]: T,
        centerOffset: S - T - P,
        ...k && {
          alignmentOffset: P
        }
      },
      reset: k
    };
  }
}), Kp = function(e) {
  return e === void 0 && (e = {}), {
    name: "flip",
    options: e,
    async fn(t) {
      var n, r;
      const {
        placement: o,
        middlewareData: i,
        rects: s,
        initialPlacement: a,
        platform: l,
        elements: u
      } = t, {
        mainAxis: c = !0,
        crossAxis: f = !0,
        fallbackPlacements: d,
        fallbackStrategy: g = "bestFit",
        fallbackAxisSideDirection: p = "none",
        flipAlignment: x = !0,
        ...C
      } = Vo(e, t);
      if ((n = i.arrow) != null && n.alignmentOffset)
        return {};
      const $ = fr(o), m = Ir(a), _ = fr(a) === a, v = await (l.isRTL == null ? void 0 : l.isRTL(u.floating)), b = d || (_ || !x ? [Ci(a)] : Bp(a)), N = p !== "none";
      !d && N && b.push(...Zp(a, x, p, v));
      const E = [a, ...b], M = await cd(t, C), D = [];
      let V = ((r = i.flip) == null ? void 0 : r.overflows) || [];
      if (c && D.push(M[$]), f) {
        const S = Rp(o, s, v);
        D.push(M[S[0]], M[S[1]]);
      }
      if (V = [...V, {
        placement: o,
        overflows: D
      }], !D.every((S) => S <= 0)) {
        var A, O;
        const S = (((A = i.flip) == null ? void 0 : A.index) || 0) + 1, T = E[S];
        if (T)
          return {
            data: {
              index: S,
              overflows: V
            },
            reset: {
              placement: T
            }
          };
        let k = (O = V.filter((P) => P.overflows[0] <= 0).sort((P, H) => P.overflows[1] - H.overflows[1])[0]) == null ? void 0 : O.placement;
        if (!k)
          switch (g) {
            case "bestFit": {
              var R;
              const P = (R = V.filter((H) => {
                if (N) {
                  const I = Ir(H.placement);
                  return I === m || // Create a bias to the `y` side axis due to horizontal
                  // reading directions favoring greater width.
                  I === "y";
                }
                return !0;
              }).map((H) => [H.placement, H.overflows.filter((I) => I > 0).reduce((I, B) => I + B, 0)]).sort((H, I) => H[1] - I[1])[0]) == null ? void 0 : R[0];
              P && (k = P);
              break;
            }
            case "initialPlacement":
              k = a;
              break;
          }
        if (o !== k)
          return {
            reset: {
              placement: k
            }
          };
      }
      return {};
    }
  };
};
async function qp(e, t) {
  const {
    placement: n,
    platform: r,
    elements: o
  } = e, i = await (r.isRTL == null ? void 0 : r.isRTL(o.floating)), s = fr(n), a = Do(n), l = Ir(n) === "y", u = ["left", "top"].includes(s) ? -1 : 1, c = i && l ? -1 : 1, f = Vo(t, e);
  let {
    mainAxis: d,
    crossAxis: g,
    alignmentAxis: p
  } = typeof f == "number" ? {
    mainAxis: f,
    crossAxis: 0,
    alignmentAxis: null
  } : {
    mainAxis: f.mainAxis || 0,
    crossAxis: f.crossAxis || 0,
    alignmentAxis: f.alignmentAxis
  };
  return a && typeof p == "number" && (g = a === "end" ? p * -1 : p), l ? {
    x: g * c,
    y: d * u
  } : {
    x: d * u,
    y: g * c
  };
}
const Gp = function(e) {
  return e === void 0 && (e = 0), {
    name: "offset",
    options: e,
    async fn(t) {
      var n, r;
      const {
        x: o,
        y: i,
        placement: s,
        middlewareData: a
      } = t, l = await qp(t, e);
      return s === ((n = a.offset) == null ? void 0 : n.placement) && (r = a.arrow) != null && r.alignmentOffset ? {} : {
        x: o + l.x,
        y: i + l.y,
        data: {
          ...l,
          placement: s
        }
      };
    }
  };
}, Up = function(e) {
  return e === void 0 && (e = {}), {
    name: "shift",
    options: e,
    async fn(t) {
      const {
        x: n,
        y: r,
        placement: o
      } = t, {
        mainAxis: i = !0,
        crossAxis: s = !1,
        limiter: a = {
          fn: (C) => {
            let {
              x: $,
              y: m
            } = C;
            return {
              x: $,
              y: m
            };
          }
        },
        ...l
      } = Vo(e, t), u = {
        x: n,
        y: r
      }, c = await cd(t, l), f = Ir(fr(o)), d = ld(f);
      let g = u[d], p = u[f];
      if (i) {
        const C = d === "y" ? "top" : "left", $ = d === "y" ? "bottom" : "right", m = g + c[C], _ = g - c[$];
        g = Ds(m, g, _);
      }
      if (s) {
        const C = f === "y" ? "top" : "left", $ = f === "y" ? "bottom" : "right", m = p + c[C], _ = p - c[$];
        p = Ds(m, p, _);
      }
      const x = a.fn({
        ...t,
        [d]: g,
        [f]: p
      });
      return {
        ...x,
        data: {
          x: x.x - n,
          y: x.y - r,
          enabled: {
            [d]: i,
            [f]: s
          }
        }
      };
    }
  };
};
function Ki() {
  return typeof window < "u";
}
function Wr(e) {
  return dd(e) ? (e.nodeName || "").toLowerCase() : "#document";
}
function Bt(e) {
  var t;
  return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function zn(e) {
  var t;
  return (t = (dd(e) ? e.ownerDocument : e.document) || window.document) == null ? void 0 : t.documentElement;
}
function dd(e) {
  return Ki() ? e instanceof Node || e instanceof Bt(e).Node : !1;
}
function an(e) {
  return Ki() ? e instanceof Element || e instanceof Bt(e).Element : !1;
}
function _n(e) {
  return Ki() ? e instanceof HTMLElement || e instanceof Bt(e).HTMLElement : !1;
}
function Hl(e) {
  return !Ki() || typeof ShadowRoot > "u" ? !1 : e instanceof ShadowRoot || e instanceof Bt(e).ShadowRoot;
}
function Ao(e) {
  const {
    overflow: t,
    overflowX: n,
    overflowY: r,
    display: o
  } = ln(e);
  return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && !["inline", "contents"].includes(o);
}
function jp(e) {
  return ["table", "td", "th"].includes(Wr(e));
}
function qi(e) {
  return [":popover-open", ":modal"].some((t) => {
    try {
      return e.matches(t);
    } catch {
      return !1;
    }
  });
}
function ma(e) {
  const t = ya(), n = an(e) ? ln(e) : e;
  return ["transform", "translate", "scale", "rotate", "perspective"].some((r) => n[r] ? n[r] !== "none" : !1) || (n.containerType ? n.containerType !== "normal" : !1) || !t && (n.backdropFilter ? n.backdropFilter !== "none" : !1) || !t && (n.filter ? n.filter !== "none" : !1) || ["transform", "translate", "scale", "rotate", "perspective", "filter"].some((r) => (n.willChange || "").includes(r)) || ["paint", "layout", "strict", "content"].some((r) => (n.contain || "").includes(r));
}
function Jp(e) {
  let t = er(e);
  for (; _n(t) && !zr(t); ) {
    if (ma(t))
      return t;
    if (qi(t))
      return null;
    t = er(t);
  }
  return null;
}
function ya() {
  return typeof CSS > "u" || !CSS.supports ? !1 : CSS.supports("-webkit-backdrop-filter", "none");
}
function zr(e) {
  return ["html", "body", "#document"].includes(Wr(e));
}
function ln(e) {
  return Bt(e).getComputedStyle(e);
}
function Gi(e) {
  return an(e) ? {
    scrollLeft: e.scrollLeft,
    scrollTop: e.scrollTop
  } : {
    scrollLeft: e.scrollX,
    scrollTop: e.scrollY
  };
}
function er(e) {
  if (Wr(e) === "html")
    return e;
  const t = (
    // Step into the shadow DOM of the parent of a slotted node.
    e.assignedSlot || // DOM Element detected.
    e.parentNode || // ShadowRoot detected.
    Hl(e) && e.host || // Fallback.
    zn(e)
  );
  return Hl(t) ? t.host : t;
}
function fd(e) {
  const t = er(e);
  return zr(t) ? e.ownerDocument ? e.ownerDocument.body : e.body : _n(t) && Ao(t) ? t : fd(t);
}
function gd(e, t, n) {
  var r;
  t === void 0 && (t = []);
  const o = fd(e), i = o === ((r = e.ownerDocument) == null ? void 0 : r.body), s = Bt(o);
  return i ? (Ls(s), t.concat(s, s.visualViewport || [], Ao(o) ? o : [], [])) : t.concat(o, gd(o, []));
}
function Ls(e) {
  return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
function hd(e) {
  const t = ln(e);
  let n = parseFloat(t.width) || 0, r = parseFloat(t.height) || 0;
  const o = _n(e), i = o ? e.offsetWidth : n, s = o ? e.offsetHeight : r, a = bi(n) !== i || bi(r) !== s;
  return a && (n = i, r = s), {
    width: n,
    height: r,
    $: a
  };
}
function vd(e) {
  return an(e) ? e : e.contextElement;
}
function Sr(e) {
  const t = vd(e);
  if (!_n(t))
    return mn(1);
  const n = t.getBoundingClientRect(), {
    width: r,
    height: o,
    $: i
  } = hd(t);
  let s = (i ? bi(n.width) : n.width) / r, a = (i ? bi(n.height) : n.height) / o;
  return (!s || !Number.isFinite(s)) && (s = 1), (!a || !Number.isFinite(a)) && (a = 1), {
    x: s,
    y: a
  };
}
const Qp = /* @__PURE__ */ mn(0);
function pd(e) {
  const t = Bt(e);
  return !ya() || !t.visualViewport ? Qp : {
    x: t.visualViewport.offsetLeft,
    y: t.visualViewport.offsetTop
  };
}
function em(e, t, n) {
  return t === void 0 && (t = !1), !n || t && n !== Bt(e) ? !1 : t;
}
function xo(e, t, n, r) {
  t === void 0 && (t = !1), n === void 0 && (n = !1);
  const o = e.getBoundingClientRect(), i = vd(e);
  let s = mn(1);
  t && (r ? an(r) && (s = Sr(r)) : s = Sr(e));
  const a = em(i, n, r) ? pd(i) : mn(0);
  let l = (o.left + a.x) / s.x, u = (o.top + a.y) / s.y, c = o.width / s.x, f = o.height / s.y;
  if (i) {
    const d = Bt(i), g = r && an(r) ? Bt(r) : r;
    let p = d, x = Ls(p);
    for (; x && r && g !== p; ) {
      const C = Sr(x), $ = x.getBoundingClientRect(), m = ln(x), _ = $.left + (x.clientLeft + parseFloat(m.paddingLeft)) * C.x, v = $.top + (x.clientTop + parseFloat(m.paddingTop)) * C.y;
      l *= C.x, u *= C.y, c *= C.x, f *= C.y, l += _, u += v, p = Bt(x), x = Ls(p);
    }
  }
  return ki({
    width: c,
    height: f,
    x: l,
    y: u
  });
}
function wa(e, t) {
  const n = Gi(e).scrollLeft;
  return t ? t.left + n : xo(zn(e)).left + n;
}
function md(e, t, n) {
  n === void 0 && (n = !1);
  const r = e.getBoundingClientRect(), o = r.left + t.scrollLeft - (n ? 0 : (
    // RTL <body> scrollbar.
    wa(e, r)
  )), i = r.top + t.scrollTop;
  return {
    x: o,
    y: i
  };
}
function tm(e) {
  let {
    elements: t,
    rect: n,
    offsetParent: r,
    strategy: o
  } = e;
  const i = o === "fixed", s = zn(r), a = t ? qi(t.floating) : !1;
  if (r === s || a && i)
    return n;
  let l = {
    scrollLeft: 0,
    scrollTop: 0
  }, u = mn(1);
  const c = mn(0), f = _n(r);
  if ((f || !f && !i) && ((Wr(r) !== "body" || Ao(s)) && (l = Gi(r)), _n(r))) {
    const g = xo(r);
    u = Sr(r), c.x = g.x + r.clientLeft, c.y = g.y + r.clientTop;
  }
  const d = s && !f && !i ? md(s, l, !0) : mn(0);
  return {
    width: n.width * u.x,
    height: n.height * u.y,
    x: n.x * u.x - l.scrollLeft * u.x + c.x + d.x,
    y: n.y * u.y - l.scrollTop * u.y + c.y + d.y
  };
}
function nm(e) {
  return Array.from(e.getClientRects());
}
function rm(e) {
  const t = zn(e), n = Gi(e), r = e.ownerDocument.body, o = Er(t.scrollWidth, t.clientWidth, r.scrollWidth, r.clientWidth), i = Er(t.scrollHeight, t.clientHeight, r.scrollHeight, r.clientHeight);
  let s = -n.scrollLeft + wa(e);
  const a = -n.scrollTop;
  return ln(r).direction === "rtl" && (s += Er(t.clientWidth, r.clientWidth) - o), {
    width: o,
    height: i,
    x: s,
    y: a
  };
}
function om(e, t) {
  const n = Bt(e), r = zn(e), o = n.visualViewport;
  let i = r.clientWidth, s = r.clientHeight, a = 0, l = 0;
  if (o) {
    i = o.width, s = o.height;
    const u = ya();
    (!u || u && t === "fixed") && (a = o.offsetLeft, l = o.offsetTop);
  }
  return {
    width: i,
    height: s,
    x: a,
    y: l
  };
}
function im(e, t) {
  const n = xo(e, !0, t === "fixed"), r = n.top + e.clientTop, o = n.left + e.clientLeft, i = _n(e) ? Sr(e) : mn(1), s = e.clientWidth * i.x, a = e.clientHeight * i.y, l = o * i.x, u = r * i.y;
  return {
    width: s,
    height: a,
    x: l,
    y: u
  };
}
function Vl(e, t, n) {
  let r;
  if (t === "viewport")
    r = om(e, n);
  else if (t === "document")
    r = rm(zn(e));
  else if (an(t))
    r = im(t, n);
  else {
    const o = pd(e);
    r = {
      x: t.x - o.x,
      y: t.y - o.y,
      width: t.width,
      height: t.height
    };
  }
  return ki(r);
}
function yd(e, t) {
  const n = er(e);
  return n === t || !an(n) || zr(n) ? !1 : ln(n).position === "fixed" || yd(n, t);
}
function sm(e, t) {
  const n = t.get(e);
  if (n)
    return n;
  let r = gd(e, []).filter((a) => an(a) && Wr(a) !== "body"), o = null;
  const i = ln(e).position === "fixed";
  let s = i ? er(e) : e;
  for (; an(s) && !zr(s); ) {
    const a = ln(s), l = ma(s);
    !l && a.position === "fixed" && (o = null), (i ? !l && !o : !l && a.position === "static" && !!o && ["absolute", "fixed"].includes(o.position) || Ao(s) && !l && yd(e, s)) ? r = r.filter((c) => c !== s) : o = a, s = er(s);
  }
  return t.set(e, r), r;
}
function am(e) {
  let {
    element: t,
    boundary: n,
    rootBoundary: r,
    strategy: o
  } = e;
  const s = [...n === "clippingAncestors" ? qi(t) ? [] : sm(t, this._c) : [].concat(n), r], a = s[0], l = s.reduce((u, c) => {
    const f = Vl(t, c, o);
    return u.top = Er(f.top, u.top), u.right = _o(f.right, u.right), u.bottom = _o(f.bottom, u.bottom), u.left = Er(f.left, u.left), u;
  }, Vl(t, a, o));
  return {
    width: l.right - l.left,
    height: l.bottom - l.top,
    x: l.left,
    y: l.top
  };
}
function lm(e) {
  const {
    width: t,
    height: n
  } = hd(e);
  return {
    width: t,
    height: n
  };
}
function um(e, t, n) {
  const r = _n(t), o = zn(t), i = n === "fixed", s = xo(e, !0, i, t);
  let a = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const l = mn(0);
  if (r || !r && !i)
    if ((Wr(t) !== "body" || Ao(o)) && (a = Gi(t)), r) {
      const d = xo(t, !0, i, t);
      l.x = d.x + t.clientLeft, l.y = d.y + t.clientTop;
    } else o && (l.x = wa(o));
  const u = o && !r && !i ? md(o, a) : mn(0), c = s.left + a.scrollLeft - l.x - u.x, f = s.top + a.scrollTop - l.y - u.y;
  return {
    x: c,
    y: f,
    width: s.width,
    height: s.height
  };
}
function fs(e) {
  return ln(e).position === "static";
}
function Dl(e, t) {
  if (!_n(e) || ln(e).position === "fixed")
    return null;
  if (t)
    return t(e);
  let n = e.offsetParent;
  return zn(e) === n && (n = n.ownerDocument.body), n;
}
function wd(e, t) {
  const n = Bt(e);
  if (qi(e))
    return n;
  if (!_n(e)) {
    let o = er(e);
    for (; o && !zr(o); ) {
      if (an(o) && !fs(o))
        return o;
      o = er(o);
    }
    return n;
  }
  let r = Dl(e, t);
  for (; r && jp(r) && fs(r); )
    r = Dl(r, t);
  return r && zr(r) && fs(r) && !ma(r) ? n : r || Jp(e) || n;
}
const cm = async function(e) {
  const t = this.getOffsetParent || wd, n = this.getDimensions, r = await n(e.floating);
  return {
    reference: um(e.reference, await t(e.floating), e.strategy),
    floating: {
      x: 0,
      y: 0,
      width: r.width,
      height: r.height
    }
  };
};
function dm(e) {
  return ln(e).direction === "rtl";
}
const fm = {
  convertOffsetParentRelativeRectToViewportRelativeRect: tm,
  getDocumentElement: zn,
  getClippingRect: am,
  getOffsetParent: wd,
  getElementRects: cm,
  getClientRects: nm,
  getDimensions: lm,
  getScale: Sr,
  isElement: an,
  isRTL: dm
}, gm = Gp, hm = Up, vm = Kp, pm = Wp, mm = (e, t, n) => {
  const r = /* @__PURE__ */ new Map(), o = {
    platform: fm,
    ...n
  }, i = {
    ...o.platform,
    _c: r
  };
  return Fp(e, t, {
    ...o,
    platform: i
  });
}, ym = ({
  trigger: e,
  triggerEvent: t,
  floatContent: n,
  placement: r = "bottom",
  offsetOptions: o,
  flipOptions: i,
  shiftOptions: s,
  interactive: a,
  showArrow: l
}) => {
  if (typeof e == "string") {
    const $ = document.querySelector(e);
    if ($)
      e = $;
    else
      throw new Error("element not found by document.querySelector('" + e + "')");
  }
  let u;
  if (typeof n == "string") {
    const $ = document.querySelector(n);
    if ($)
      u = $;
    else
      throw new Error("element not found by document.querySelector('" + n + "')");
  } else
    u = n;
  let c;
  l && (c = document.createElement("div"), c.style.position = "absolute", c.style.backgroundColor = "#222", c.style.width = "8px", c.style.height = "8px", c.style.transform = "rotate(45deg)", c.style.display = "none", u.firstElementChild.before(c));
  function f() {
    mm(e, u, {
      placement: r,
      middleware: [
        gm(o),
        // 手动偏移配置
        vm(i),
        //自动翻转
        hm(s),
        //自动偏移（使得浮动元素能够进入视野）
        ...l ? [pm({ element: c })] : []
      ]
    }).then(({ x: $, y: m, placement: _, middlewareData: v }) => {
      if (Object.assign(u.style, {
        left: `${$}px`,
        top: `${m}px`
      }), l) {
        const { x: b, y: N } = v.arrow, E = {
          top: "bottom",
          right: "left",
          bottom: "top",
          left: "right"
        }[_.split("-")[0]];
        Object.assign(c.style, {
          zIndex: -1,
          left: b != null ? `${b}px` : "",
          top: N != null ? `${N}px` : "",
          right: "",
          bottom: "",
          [E]: "2px"
        });
      }
    });
  }
  let d = !1;
  function g() {
    u.style.display = "block", u.style.visibility = "block", u.style.position = "absolute", l && (c.style.display = "block"), d = !0, f();
  }
  function p() {
    u.style.display = "none", l && (c.style.display = "none"), d = !1;
  }
  function x($) {
    $.stopPropagation(), d ? p() : g();
  }
  function C($) {
    u.contains($.target) || p();
  }
  return (!t || t.length == 0) && (t = ["click"]), t.forEach(($) => {
    e.addEventListener($, x);
  }), document.addEventListener("click", C), {
    destroy() {
      t.forEach(($) => {
        e.removeEventListener($, x);
      }), document.removeEventListener("click", C);
    },
    hide() {
      p();
    },
    isVisible() {
      return d;
    }
  };
};
var wm = /* @__PURE__ */ ne('<div style="position: relative"><div><!></div> <div style="display: none; width: 100%;z-index: 9999"><!></div></div>');
function Lo(e, t) {
  de(t, !0);
  const n = w(t, "children", 7), r = w(t, "floating", 7), o = w(t, "placement", 7, "bottom");
  let i, s, a;
  un(() => (a = ym({
    trigger: i,
    floatContent: s,
    interactive: !0,
    placement: o()
  }), () => {
    a.destroy();
  }));
  function l() {
    a.hide();
  }
  var u = wm(), c = X(u), f = X(c);
  lr(f, n), Z(c), An(c, (p) => i = p, () => i);
  var d = z(c, 2), g = X(d);
  return lr(g, r), Z(d), An(d, (p) => s = p, () => s), Z(u), L(e, u), fe({
    hide: l,
    get children() {
      return n();
    },
    set children(p) {
      n(p), y();
    },
    get floating() {
      return r();
    },
    set floating(p) {
      r(p), y();
    },
    get placement() {
      return o();
    },
    set placement(p = "bottom") {
      o(p), y();
    }
  });
}
ae(Lo, { children: {}, floating: {}, placement: {} }, [], ["hide"], !0);
function Ge(e, t) {
  de(t, !0);
  const n = w(t, "children", 7), r = w(t, "level", 7, 1), o = w(t, "mt", 7), i = w(t, "mb", 7);
  var s = et(), a = be(s);
  return m1(a, () => `h${r()}`, !1, (l, u) => {
    let c;
    Ee(() => c = on(
      l,
      c,
      {
        class: "tf-heading",
        style: `margin-top:${o() || "0"};margin-bottom:${i() || "0"}`
      },
      void 0,
      l.namespaceURI === Rl,
      l.nodeName.includes("-")
    ));
    var f = et(), d = be(f);
    lr(d, () => n() ?? dt), L(u, f);
  }), L(e, s), fe({
    get children() {
      return n();
    },
    set children(l) {
      n(l), y();
    },
    get level() {
      return r();
    },
    set level(l = 1) {
      r(l), y();
    },
    get mt() {
      return o();
    },
    set mt(l) {
      o(l), y();
    },
    get mb() {
      return i();
    },
    set mb(l) {
      i(l), y();
    }
  });
}
ae(Ge, { children: {}, level: {}, mt: {}, mb: {} }, [], [], !0);
var _m = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="svelte-1rvn4a8"><path d="M4.5 10.5C3.675 10.5 3 11.175 3 12C3 12.825 3.675 13.5 4.5 13.5C5.325 13.5 6 12.825 6 12C6 11.175 5.325 10.5 4.5 10.5ZM19.5 10.5C18.675 10.5 18 11.175 18 12C18 12.825 18.675 13.5 19.5 13.5C20.325 13.5 21 12.825 21 12C21 11.175 20.325 10.5 19.5 10.5ZM12 10.5C11.175 10.5 10.5 11.175 10.5 12C10.5 12.825 11.175 13.5 12 13.5C12.825 13.5 13.5 12.825 13.5 12C13.5 11.175 12.825 10.5 12 10.5Z" class="svelte-1rvn4a8"></path></svg>');
const xm = {
  hash: "svelte-1rvn4a8",
  code: ".input-btn-more {border:1px solid transparent;padding:3px;&:hover {background:#eee;border:1px solid transparent;}}"
};
function Ui(e, t) {
  de(t, !0), Je(e, xm);
  const n = /* @__PURE__ */ yt(t, ["$$slots", "$$events", "$$legacy", "$$host"]);
  Ke(e, ut(() => n, {
    get class() {
      return `input-btn-more ${t.class ?? ""}`;
    },
    children: (r, o) => {
      var i = _m();
      L(r, i);
    },
    $$slots: { default: !0 }
  })), fe();
}
ae(Ui, {}, [], [], !0);
const bm = () => {
  const e = Ue();
  return {
    deleteNode: (n) => {
      e.nodes.update((r) => r.filter((o) => o.id !== n)), e.edges.update(
        (r) => r.filter((o) => o.source !== n && o.target !== n)
      );
    }
  };
}, Rr = (e = 16) => {
  const t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", n = new Uint8Array(e);
  return crypto.getRandomValues(n), Array.from(n, (r) => t[r % t.length]).join("");
}, Cm = () => {
  const { nodes: e, nodeLookup: t } = Ue();
  return {
    copyNode: (r) => {
      var s;
      const i = (s = q(t).get(r)) == null ? void 0 : s.internals.userNode;
      if (i) {
        const a = Rr(), l = {
          ...i,
          id: a,
          position: {
            x: i.position.x + 50,
            y: i.position.y + 50
          }
        };
        e.update((u) => [...u, l]), e.update(
          (u) => u.map(
            (c) => c.id === a ? { ...c, selected: !0 } : { ...c, selected: !1 }
          )
        );
      }
    }
  };
};
var km = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 18.3915V5.60846L18.2264 12L8 18.3915ZM6 3.80421V20.1957C6 20.9812 6.86395 21.46 7.53 21.0437L20.6432 12.848C21.2699 12.4563 21.2699 11.5436 20.6432 11.152L7.53 2.95621C6.86395 2.53993 6 3.01878 6 3.80421Z"></path></svg>'), $m = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6.9998 6V3C6.9998 2.44772 7.44752 2 7.9998 2H19.9998C20.5521 2 20.9998 2.44772 20.9998 3V17C20.9998 17.5523 20.5521 18 19.9998 18H16.9998V20.9991C16.9998 21.5519 16.5499 22 15.993 22H4.00666C3.45059 22 3 21.5554 3 20.9991L3.0026 7.00087C3.0027 6.44811 3.45264 6 4.00942 6H6.9998ZM5.00242 8L5.00019 20H14.9998V8H5.00242ZM8.9998 6H16.9998V16H18.9998V4H8.9998V6Z"></path></svg>'), Em = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM18 8H6V20H18V8ZM9 11H11V17H9V11ZM13 11H15V17H13V11ZM9 4V6H15V4H9Z"></path></svg>'), Sm = /* @__PURE__ */ ne('<div class="tf-node-toolbar svelte-44dmwv"><!> <!> <!></div>'), Pm = /* @__PURE__ */ ne('<!> <div class="tf-node-wrapper"><div class="tf-node-wrapper-title">TinyFlow.ai</div> <div class="tf-node-wrapper-body"><!></div></div> <!> <!> <!>', 1);
const Nm = {
  hash: "svelte-44dmwv",
  code: ".tf-node-toolbar.svelte-44dmwv {display:flex;gap:5px;padding:5px;border-radius:5px;background:#fff;border:1px solid #eee;box-shadow:0 0 5px rgba(0, 0, 0, 0.1);}.tf-node-toolbar-item {border:1px solid transparent;}"
};
function dn(e, t) {
  de(t, !0), Je(e, Nm);
  const n = w(t, "data", 7), r = w(t, "id", 7, ""), o = w(t, "icon", 7), i = w(t, "handle", 7), s = w(t, "children", 7), a = w(t, "allowExecute", 7, !0), l = w(t, "allowCopy", 7, !0), u = w(t, "allowDelete", 7, !0), c = w(t, "showSourceHandle", 7, !0), f = w(t, "showTargetHandle", 7, !0);
  let d = n().expand ? ["key"] : [];
  const { updateNodeData: g } = Dt(), p = [
    {
      key: "key",
      icon: o(),
      title: n().title,
      description: n().description,
      content: s()
    }
  ], { deleteNode: x } = bm(), { copyNode: C } = Cm();
  var $ = Pm(), m = be($);
  {
    var _ = (O) => {
      od(O, {
        get position() {
          return $e.Top;
        },
        align: "end",
        children: (R, S) => {
          var T = Sm(), k = X(T);
          {
            var P = (K) => {
              Ke(K, {
                class: "tf-node-toolbar-item",
                children: (ie, ee) => {
                  var W = km();
                  L(ie, W);
                },
                $$slots: { default: !0 }
              });
            };
            ke(k, (K) => {
              a() && K(P);
            });
          }
          var H = z(k, 2);
          {
            var I = (K) => {
              Ke(K, {
                class: "tf-node-toolbar-item",
                onclick: () => {
                  C(r());
                },
                children: (ie, ee) => {
                  var W = $m();
                  L(ie, W);
                },
                $$slots: { default: !0 }
              });
            };
            ke(H, (K) => {
              l() && K(I);
            });
          }
          var B = z(H, 2);
          {
            var F = (K) => {
              Ke(K, {
                class: "tf-node-toolbar-item",
                onclick: () => {
                  x(r());
                },
                children: (ie, ee) => {
                  var W = Em();
                  L(ie, W);
                },
                $$slots: { default: !0 }
              });
            };
            ke(B, (K) => {
              u() && K(F);
            });
          }
          Z(T), L(R, T);
        },
        $$slots: { default: !0 }
      });
    };
    ke(m, (O) => {
      (a() || l() || u()) && O(_);
    });
  }
  var v = z(m, 2), b = z(X(v), 2), N = X(b);
  ad(N, {
    items: p,
    activeKeys: d,
    onChange: (O, R) => {
      g(r(), { expand: R == null ? void 0 : R.includes("key") });
    }
  }), Z(b), Z(v);
  var E = z(v, 2);
  {
    var M = (O) => {
      Qn(O, {
        type: "target",
        get position() {
          return $e.Left;
        },
        style: " left: -12px;top: 20px"
      });
    };
    ke(E, (O) => {
      f() && O(M);
    });
  }
  var D = z(E, 2);
  {
    var V = (O) => {
      Qn(O, {
        type: "source",
        get position() {
          return $e.Right;
        },
        style: "right: -12px;top: 20px"
      });
    };
    ke(D, (O) => {
      c() && O(V);
    });
  }
  var A = z(D, 2);
  return lr(A, () => i() ?? dt), L(e, $), fe({
    get data() {
      return n();
    },
    set data(O) {
      n(O), y();
    },
    get id() {
      return r();
    },
    set id(O = "") {
      r(O), y();
    },
    get icon() {
      return o();
    },
    set icon(O) {
      o(O), y();
    },
    get handle() {
      return i();
    },
    set handle(O) {
      i(O), y();
    },
    get children() {
      return s();
    },
    set children(O) {
      s(O), y();
    },
    get allowExecute() {
      return a();
    },
    set allowExecute(O = !0) {
      a(O), y();
    },
    get allowCopy() {
      return l();
    },
    set allowCopy(O = !0) {
      l(O), y();
    },
    get allowDelete() {
      return u();
    },
    set allowDelete(O = !0) {
      u(O), y();
    },
    get showSourceHandle() {
      return c();
    },
    set showSourceHandle(O = !0) {
      c(O), y();
    },
    get showTargetHandle() {
      return f();
    },
    set showTargetHandle(O = !0) {
      f(O), y();
    }
  });
}
ae(
  dn,
  {
    data: {},
    id: {},
    icon: {},
    handle: {},
    children: {},
    allowExecute: {},
    allowCopy: {},
    allowDelete: {},
    showSourceHandle: {},
    showTargetHandle: {}
  },
  [],
  [],
  !0
);
function ht() {
  return ar("svelteflow__node_id");
}
const _d = [
  {
    value: "String",
    label: "String"
  },
  {
    value: "Number",
    label: "Number"
  },
  {
    value: "Boolean",
    label: "Boolean"
  },
  {
    value: "File",
    label: "File"
  },
  {
    value: "Object",
    label: "Object"
  },
  {
    value: "Array",
    label: "Array"
  }
], Mm = [
  {
    value: "ref",
    label: "引用"
  },
  {
    value: "input",
    label: "固定值"
  }
];
var Tm = /* @__PURE__ */ ne('<div class="input-more-setting svelte-laou7w"><div class="input-more-item svelte-laou7w">参数类型： <!></div> <div class="input-more-item svelte-laou7w">默认值： <!></div> <div class="input-more-item svelte-laou7w">参数描述： <!></div> <div class="input-more-item svelte-laou7w"><!></div></div>'), Hm = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 10.5C3.675 10.5 3 11.175 3 12C3 12.825 3.675 13.5 4.5 13.5C5.325 13.5 6 12.825 6 12C6 11.175 5.325 10.5 4.5 10.5ZM19.5 10.5C18.675 10.5 18 11.175 18 12C18 12.825 18.675 13.5 19.5 13.5C20.325 13.5 21 12.825 21 12C21 11.175 20.325 10.5 19.5 10.5ZM12 10.5C11.175 10.5 10.5 11.175 10.5 12C10.5 12.825 11.175 13.5 12 13.5C12.825 13.5 13.5 12.825 13.5 12C13.5 11.175 12.825 10.5 12 10.5Z"></path></svg>'), Vm = /* @__PURE__ */ ne('<div class="input-item svelte-laou7w"><!></div> <div class="input-item svelte-laou7w"><!></div> <div class="input-item svelte-laou7w"><!></div>', 1);
const Dm = {
  hash: "svelte-laou7w",
  code: ".input-item.svelte-laou7w {display:flex;align-items:center;}.input-more-setting.svelte-laou7w {display:flex;flex-direction:column;gap:10px;padding:10px;background:#fff;border:1px solid #ddd;border-radius:5px;width:200px;box-shadow:0 0 10px 2px rgba(0, 0, 0, 0.1);}.input-more-setting.svelte-laou7w .input-more-item:where(.svelte-laou7w) {display:flex;flex-direction:column;gap:3px;font-size:12px;color:#666;}"
};
function xd(e, t) {
  de(t, !0), Je(e, Dm);
  const [n, r] = tt(), o = () => Q(h(l), "$node", n), i = w(t, "parameter", 7), s = w(t, "index", 7);
  let a = ht(), l = /* @__PURE__ */ Me(() => pr(a)), u = /* @__PURE__ */ Me(() => {
    var M, D;
    return {
      ...i(),
      ...(D = (M = o()) == null ? void 0 : M.data) == null ? void 0 : D.parameters[s()]
    };
  });
  const { updateNodeData: c } = Dt(), f = (M) => {
    const D = M.target.value;
    c(a, (V) => {
      let A = V.data.parameters;
      return A[s()].name = D, { parameters: A };
    });
  }, d = (M) => {
    const D = M.target.checked;
    c(a, (V) => {
      let A = V.data.parameters;
      return A[s()].required = D, { parameters: A };
    });
  }, g = (M) => {
    const D = M.value;
    D && c(a, (V) => {
      let A = V.data.parameters;
      return A[s()].dataType = D, { parameters: A };
    });
  };
  let p;
  const x = () => {
    c(a, (M) => {
      let D = M.data.parameters;
      return D.splice(s(), 1), { parameters: [...D] };
    }), p == null || p.hide();
  };
  var C = Vm(), $ = be(C), m = X($);
  xt(m, {
    style: "width: 100%;",
    get value() {
      return h(u).name;
    },
    placeholder: "请输入参数名称",
    oninput: f
  }), Z($);
  var _ = z($, 2), v = X(_);
  id(v, {
    get checked() {
      return h(u).required;
    },
    onchange: d
  }), Z(_);
  var b = z(_, 2), N = X(b);
  An(
    Lo(N, {
      placement: "bottom",
      floating: (D) => {
        var V = Tm(), A = X(V), O = z(X(A));
        const R = /* @__PURE__ */ Me(() => h(u).dataType ? [h(u).dataType] : ["String"]);
        sn(O, {
          items: _d,
          style: "width: 100%",
          onSelect: g,
          get value() {
            return h(R);
          }
        }), Z(A);
        var S = z(A, 2), T = z(X(S));
        $t(T, { rows: 1, style: "width: 100%;" }), Z(S);
        var k = z(S, 2), P = z(X(k));
        $t(P, { rows: 3, style: "width: 100%;" }), Z(k);
        var H = z(k, 2), I = X(H);
        Ke(I, {
          onclick: x,
          children: (B, F) => {
            Se();
            var K = Ie("删除");
            L(B, K);
          },
          $$slots: { default: !0 }
        }), Z(H), Z(V), L(D, V);
      },
      children: (D, V) => {
        Ke(D, {
          class: "input-btn-more",
          children: (A, O) => {
            var R = Hm();
            L(A, R);
          },
          $$slots: { default: !0 }
        });
      },
      $$slots: { floating: !0, default: !0 }
    }),
    (D) => p = D,
    () => p
  ), Z(b), L(e, C);
  var E = fe({
    get parameter() {
      return i();
    },
    set parameter(M) {
      i(M), y();
    },
    get index() {
      return s();
    },
    set index(M) {
      s(M), y();
    }
  });
  return r(), E;
}
ae(xd, { parameter: {}, index: {} }, [], [], !0);
var Am = /* @__PURE__ */ ne('<div class="input-header svelte-3n0wca">参数名称</div> <div class="input-header svelte-3n0wca">必填</div> <div class="input-header svelte-3n0wca"></div>', 1), Lm = /* @__PURE__ */ ne('<div class="none-params svelte-3n0wca">无输入参数</div>'), Om = /* @__PURE__ */ ne('<div class="input-container svelte-3n0wca"><!> <!></div>');
const Im = {
  hash: "svelte-3n0wca",
  code: `.input-container.svelte-3n0wca {display:grid;grid-template-columns:80% 10% 10%;row-gap:5px;column-gap:3px;}.input-container.svelte-3n0wca .none-params:where(.svelte-3n0wca) {font-size:12px;background:#f8f8f8;height:40px;display:flex;justify-content:center;align-items:center;border-radius:5px;width:calc(100% - 5px);grid-column:1 / -1;
  /* 从第一列开始到最后一列结束 */}.input-container.svelte-3n0wca .input-header:where(.svelte-3n0wca) {font-size:12px;color:#666;}`
};
function bd(e, t) {
  de(t, !0), Je(e, Im);
  const [n, r] = tt(), o = () => Q(h(s), "$node", n);
  let i = ht(), s = /* @__PURE__ */ Me(() => pr(i)), a = /* @__PURE__ */ Me(() => {
    var d, g;
    return [...((g = (d = o()) == null ? void 0 : d.data) == null ? void 0 : g.parameters) || []];
  });
  var l = Om(), u = X(l);
  {
    var c = (d) => {
      var g = Am();
      Se(4), L(d, g);
    };
    ke(u, (d) => {
      h(a).length !== 0 && d(c);
    });
  }
  var f = z(u, 2);
  Yt(
    f,
    19,
    () => h(a),
    (d) => d.id,
    (d, g, p) => {
      xd(d, {
        get parameter() {
          return h(g);
        },
        get index() {
          return h(p);
        }
      });
    },
    (d) => {
      var g = Lm();
      L(d, g);
    }
  ), Z(l), L(e, l), fe(), r();
}
ae(bd, {}, [], [], !0);
const Cd = (e) => {
  !e || e.length == 0 || e.forEach((t) => {
    t.id || (t.id = Rr()), Cd(t.children);
  });
}, kn = () => {
  const { updateNodeData: e } = Dt();
  return {
    addParameter: (t, n = "parameters", r) => {
      Cd(r == null ? void 0 : r.children);
      const o = {
        ...r,
        id: Rr()
      };
      e(t, (i) => {
        let s = i.data[n];
        return s ? s.push(o) : s = [o], {
          [n]: [...s]
        };
      });
    }
  };
};
var zm = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12C15 13.6569 13.6569 15 12 15Z"></path></svg>'), Rm = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z"></path></svg>'), Bm = /* @__PURE__ */ ne('<div class="heading svelte-r5g35l"><!> <!></div> <!>', 1);
const Ym = {
  hash: "svelte-r5g35l",
  code: ".heading.svelte-r5g35l {display:flex;margin-bottom:10px;}.input-btn-more {border:1px solid transparent;padding:3px;}.input-btn-more:hover {background:#eee;border:1px solid transparent;}"
};
function kd(e, t) {
  de(t, !0), Je(e, Ym);
  const n = w(t, "data", 7), r = /* @__PURE__ */ yt(t, [
    "$$slots",
    "$$events",
    "$$legacy",
    "$$host",
    "data"
  ]), o = ht(), { addParameter: i } = kn();
  return dn(e, ut(() => r, {
    get data() {
      return n();
    },
    allowExecute: !1,
    showTargetHandle: !1,
    icon: (a) => {
      var l = zm();
      L(a, l);
    },
    children: (a, l) => {
      var u = Bm(), c = be(u), f = X(c);
      Ge(f, {
        level: 3,
        children: (p, x) => {
          Se();
          var C = Ie("输入参数");
          L(p, C);
        },
        $$slots: { default: !0 }
      });
      var d = z(f, 2);
      Ke(d, {
        class: "input-btn-more",
        style: "margin-left: auto",
        onclick: () => {
          i(o);
        },
        children: (p, x) => {
          var C = Rm();
          L(p, C);
        },
        $$slots: { default: !0 }
      }), Z(c);
      var g = z(c, 2);
      bd(g, {}), L(a, u);
    },
    $$slots: { icon: !0, default: !0 }
  })), fe({
    get data() {
      return n();
    },
    set data(s) {
      n(s), y();
    }
  });
}
ae(kd, { data: {} }, [], [], !0);
const $d = (e, t, n) => {
  for (let r of n)
    r.target === t && r.source && (e.push(r.source), $d(e, r.source, n));
}, Al = (e, t) => {
  if (e.type === "startNode") {
    const n = e.data.parameters, r = [];
    if (n)
      for (const o of n)
        r.push({
          label: o.name + (t ? ` (Array<${o.dataType || "String"}>)` : ` (${o.dataType || "String"})`),
          value: e.id + "." + o.name
        });
    return {
      label: e.data.title,
      value: e.id,
      children: r
    };
  } else {
    if (e.type === "loopNode" && t)
      return {
        label: e.data.title,
        value: e.id,
        children: [
          {
            label: "loopItem",
            value: e.id + ".loop"
          },
          {
            label: "index (Number)",
            value: e.id + ".index"
          }
        ]
      };
    {
      const n = e.data.outputDefs;
      if (n) {
        const r = (o, i) => !o || o.length === 0 ? [] : o.map((s) => ({
          label: s.name + (t ? ` (Array<${s.dataType || "String"}>)` : ` (${s.dataType || "String"})`),
          // label: param.name ,
          value: i + "." + s.name,
          children: r(s.children, i + "." + s.name)
        }));
        return {
          label: e.data.title,
          value: e.id,
          children: r(n, e.id)
        };
      }
    }
  }
}, Zm = (e = !1) => {
  const t = ht(), n = pr(t), { nodes: r, edges: o } = Ue();
  return Kn([n, r, o], ([i, s, a]) => {
    const l = [];
    if (e) {
      for (let u of s)
        if (u.parentId === i.id) {
          const c = Al(u, u.parentId === i.id);
          c && l.push(c);
        }
    } else {
      const u = [];
      $d(u, t, a);
      for (let c of s)
        if (u.includes(c.id)) {
          const f = Al(c, c.parentId === i.id);
          f && l.push(f);
        }
    }
    return l;
  });
};
var Xm = /* @__PURE__ */ ne('<div class="input-more-setting svelte-laou7w"><div class="input-more-item svelte-laou7w">数据来源： <!></div> <div class="input-more-item svelte-laou7w">默认值： <!></div> <div class="input-more-item svelte-laou7w">参数描述： <!></div> <div class="input-more-item svelte-laou7w"><!></div></div>'), Fm = /* @__PURE__ */ ne('<div class="input-item svelte-laou7w"><!></div> <div class="input-item svelte-laou7w"><!></div> <div class="input-item svelte-laou7w"><!></div>', 1);
const Wm = {
  hash: "svelte-laou7w",
  code: ".input-item.svelte-laou7w {display:flex;align-items:center;}.input-more-setting.svelte-laou7w {display:flex;flex-direction:column;gap:10px;padding:10px;background:#fff;border:1px solid #ddd;border-radius:5px;width:200px;box-shadow:0 0 10px 2px rgba(0, 0, 0, 0.1);}.input-more-setting.svelte-laou7w .input-more-item:where(.svelte-laou7w) {display:flex;flex-direction:column;gap:3px;font-size:12px;color:#666;}"
};
function Ed(e, t) {
  de(t, !0), Je(e, Wm);
  const [n, r] = tt(), o = () => Q(h(c), "$node", n), i = () => Q(v, "$selectItems", n), s = w(t, "parameter", 7), a = w(t, "index", 7), l = w(t, "dataKeyName", 7);
  let u = ht(), c = /* @__PURE__ */ Me(() => pr(u)), f = /* @__PURE__ */ Me(() => {
    var T;
    return {
      ...s(),
      ...(T = o()) == null ? void 0 : T.data[l()][a()]
    };
  });
  const { updateNodeData: d } = Dt(), g = (T, k) => {
    d(u, (P) => {
      let H = P.data[l()];
      return H[a()] = { ...H[a()], [T]: k }, { [l()]: H };
    });
  }, p = (T) => {
    const k = T.target.value;
    g("name", k);
  }, x = (T) => {
    const k = T.target.value;
    g("value", k);
  }, C = (T) => {
    const k = T.value;
    g("ref", k);
  }, $ = (T) => {
    const k = T.value;
    g("refType", k);
  };
  let m;
  const _ = () => {
    d(u, (T) => {
      let k = T.data[l()];
      return k.splice(a(), 1), { [l()]: [...k] };
    }), m == null || m.hide();
  }, v = Zm();
  var b = Fm(), N = be(b), E = X(N);
  xt(E, {
    style: "width: 100%;",
    get value() {
      return h(f).name;
    },
    placeholder: "请输入参数名称",
    oninput: p
  }), Z(N);
  var M = z(N, 2), D = X(M);
  {
    var V = (T) => {
      xt(T, {
        get value() {
          return h(f).value;
        },
        placeholder: "请输入参数值",
        oninput: x
      });
    }, A = (T) => {
      const k = /* @__PURE__ */ Me(() => [h(f).ref]);
      sn(T, {
        get items() {
          return i();
        },
        style: "width: 100%",
        defaultValue: ["ref"],
        get value() {
          return h(k);
        },
        expandAll: !0,
        onSelect: C
      });
    };
    ke(D, (T) => {
      h(f).refType === "input" ? T(V) : T(A, !1);
    });
  }
  Z(M);
  var O = z(M, 2), R = X(O);
  An(
    Lo(R, {
      placement: "bottom",
      floating: (k) => {
        var P = Xm(), H = X(P), I = z(X(H));
        const B = /* @__PURE__ */ Me(() => h(f).refType ? [h(f).refType] : []);
        sn(I, {
          items: Mm,
          style: "width: 100%",
          defaultValue: ["ref"],
          get value() {
            return h(B);
          },
          onSelect: $
        }), Z(H);
        var F = z(H, 2), K = z(X(F));
        $t(K, {
          rows: 1,
          style: "width: 100%;",
          onchange: (me) => {
            const Ce = me.target.value;
            g("defaultValue", Ce);
          }
        }), Z(F);
        var ie = z(F, 2), ee = z(X(ie));
        $t(ee, {
          rows: 3,
          style: "width: 100%;",
          onchange: (me) => {
            const Ce = me.target.value;
            g("description", Ce);
          }
        }), Z(ie);
        var W = z(ie, 2), ue = X(W);
        Ke(ue, {
          onclick: _,
          children: (me, Ce) => {
            Se();
            var ge = Ie("删除");
            L(me, ge);
          },
          $$slots: { default: !0 }
        }), Z(W), Z(P), L(k, P);
      },
      children: (k, P) => {
        Ui(k, {});
      },
      $$slots: { floating: !0, default: !0 }
    }),
    (k) => m = k,
    () => m
  ), Z(O), L(e, b);
  var S = fe({
    get parameter() {
      return s();
    },
    set parameter(T) {
      s(T), y();
    },
    get index() {
      return a();
    },
    set index(T) {
      a(T), y();
    },
    get dataKeyName() {
      return l();
    },
    set dataKeyName(T) {
      l(T), y();
    }
  });
  return r(), S;
}
ae(Ed, { parameter: {}, index: {}, dataKeyName: {} }, [], [], !0);
var Km = /* @__PURE__ */ ne('<div class="input-header svelte-1sm1mgi">参数名称</div> <div class="input-header svelte-1sm1mgi">参数值</div> <div class="input-header svelte-1sm1mgi"></div>', 1), qm = /* @__PURE__ */ ne('<div class="none-params svelte-1sm1mgi"> </div>'), Gm = /* @__PURE__ */ ne('<div class="input-container svelte-1sm1mgi"><!> <!></div>');
const Um = {
  hash: "svelte-1sm1mgi",
  code: `.input-container.svelte-1sm1mgi {display:grid;grid-template-columns:40% 50% 10%;row-gap:5px;column-gap:3px;}.input-container.svelte-1sm1mgi .none-params:where(.svelte-1sm1mgi) {font-size:12px;background:#f8f8f8;height:40px;display:flex;justify-content:center;align-items:center;border-radius:5px;width:calc(100% - 5px);grid-column:1 / -1;
  /* 从第一列开始到最后一列结束 */}.input-container.svelte-1sm1mgi .input-header:where(.svelte-1sm1mgi) {font-size:12px;color:#666;}`
};
function zt(e, t) {
  de(t, !0), Je(e, Um);
  const [n, r] = tt(), o = () => Q(h(l), "$node", n), i = w(t, "noneParameterText", 7, "无输入参数"), s = w(t, "dataKeyName", 7, "parameters");
  let a = ht(), l = /* @__PURE__ */ Me(() => pr(a)), u = /* @__PURE__ */ Me(() => {
    var x;
    return [...((x = o()) == null ? void 0 : x.data[s()]) || []];
  });
  var c = Gm(), f = X(c);
  {
    var d = (x) => {
      var C = Km();
      Se(4), L(x, C);
    };
    ke(f, (x) => {
      h(u).length !== 0 && x(d);
    });
  }
  var g = z(f, 2);
  Yt(
    g,
    19,
    () => h(u),
    (x) => x.id,
    (x, C, $) => {
      Ed(x, {
        get parameter() {
          return h(C);
        },
        get index() {
          return h($);
        },
        get dataKeyName() {
          return s();
        }
      });
    },
    (x) => {
      var C = qm(), $ = X(C, !0);
      Z(C), Ee(() => Rt($, i())), L(x, C);
    }
  ), Z(c), L(e, c);
  var p = fe({
    get noneParameterText() {
      return i();
    },
    set noneParameterText(x = "无输入参数") {
      i(x), y();
    },
    get dataKeyName() {
      return s();
    },
    set dataKeyName(x = "parameters") {
      s(x), y();
    }
  });
  return r(), p;
}
ae(zt, { noneParameterText: {}, dataKeyName: {} }, [], [], !0);
var jm = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5.1438V16.0002H18.3391L6 5.1438ZM4 2.932C4 2.07155 5.01456 1.61285 5.66056 2.18123L21.6501 16.2494C22.3423 16.8584 21.9116 18.0002 20.9896 18.0002H6V22H4V2.932Z"></path></svg>'), Jm = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z"></path></svg>'), Qm = /* @__PURE__ */ ne('<div class="heading svelte-11h445j"><!> <!></div> <!>', 1);
const ey = {
  hash: "svelte-11h445j",
  code: ".heading.svelte-11h445j {display:flex;margin-bottom:10px;}"
};
function Sd(e, t) {
  de(t, !0), Je(e, ey);
  const n = w(t, "data", 7), r = /* @__PURE__ */ yt(t, [
    "$$slots",
    "$$events",
    "$$legacy",
    "$$host",
    "data"
  ]), o = ht(), { addParameter: i } = kn();
  return dn(e, ut(
    {
      get data() {
        return n();
      }
    },
    () => r,
    {
      allowExecute: !1,
      showSourceHandle: !1,
      icon: (a) => {
        var l = jm();
        L(a, l);
      },
      children: (a, l) => {
        var u = Qm(), c = be(u), f = X(c);
        Ge(f, {
          level: 3,
          children: (p, x) => {
            Se();
            var C = Ie("输出参数");
            L(p, C);
          },
          $$slots: { default: !0 }
        });
        var d = z(f, 2);
        Ke(d, {
          class: "input-btn-more",
          style: "margin-left: auto",
          onclick: () => {
            i(o, "outputDefs");
          },
          children: (p, x) => {
            var C = Jm();
            L(p, C);
          },
          $$slots: { default: !0 }
        }), Z(c);
        var g = z(c, 2);
        zt(g, {
          noneParameterText: "无输出参数",
          dataKeyName: "outputDefs"
        }), L(a, u);
      },
      $$slots: { icon: !0, default: !0 }
    }
  )), fe({
    get data() {
      return n();
    },
    set data(s) {
      n(s), y();
    }
  });
}
ae(Sd, { data: {} }, [], [], !0);
const Oo = () => ar("tinyflow_options");
var ty = /* @__PURE__ */ _e('<svg style="transform: scaleY(-1)" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M13 8V16C13 17.6569 11.6569 19 10 19H7.82929C7.41746 20.1652 6.30622 21 5 21C3.34315 21 2 19.6569 2 18C2 16.3431 3.34315 15 5 15C6.30622 15 7.41746 15.8348 7.82929 17H10C10.5523 17 11 16.5523 11 16V8C11 6.34315 12.3431 5 14 5H17V2L22 6L17 10V7H14C13.4477 7 13 7.44772 13 8ZM5 19C5.55228 19 6 18.5523 6 18C6 17.4477 5.55228 17 5 17C4.44772 17 4 17.4477 4 18C4 18.5523 4.44772 19 5 19Z"></path></svg>'), ny = /* @__PURE__ */ ne('<div class="input-more-item svelte-1cfeest"><!></div>'), ry = /* @__PURE__ */ ne('<div class="input-more-setting svelte-1cfeest"><div class="input-more-item svelte-1cfeest">默认值： <!></div> <div class="input-more-item svelte-1cfeest">参数描述： <!></div> <!></div>'), oy = /* @__PURE__ */ ne('<div class="input-item svelte-1cfeest"><!> <!></div> <div class="input-item svelte-1cfeest"><!> <!></div> <div class="input-item svelte-1cfeest"><!></div>', 1);
const iy = {
  hash: "svelte-1cfeest",
  code: ".input-item.svelte-1cfeest {display:flex;align-items:center;gap:2px;}.input-more-setting.svelte-1cfeest {display:flex;flex-direction:column;gap:10px;padding:10px;background:#fff;border:1px solid #ddd;border-radius:5px;width:200px;box-shadow:0 0 10px 2px rgba(0, 0, 0, 0.1);}.input-more-setting.svelte-1cfeest .input-more-item:where(.svelte-1cfeest) {display:flex;flex-direction:column;gap:3px;font-size:12px;color:#666;}"
};
function Pd(e, t) {
  de(t, !0), Je(e, iy);
  const [n, r] = tt(), o = () => Q(h(u), "$node", n), i = w(t, "parameter", 7), s = w(t, "position", 7), a = w(t, "dataKeyName", 7);
  let l = ht(), u = /* @__PURE__ */ Me(() => pr(l)), c = /* @__PURE__ */ Me(() => {
    var I;
    let P = (I = o()) == null ? void 0 : I.data[a()], H;
    if (P && s().length > 0) {
      let B = P;
      for (let F = 0; F < s().length; F++) {
        const K = s()[F];
        F == s().length - 1 ? H = B[K] : B = B[K].children;
      }
    }
    return { ...i(), ...H };
  });
  const { updateNodeData: f } = Dt(), d = (P, H) => {
    f(l, (I) => {
      const B = I.data[a()];
      if (B && s().length > 0) {
        let F = B;
        for (let K = 0; K < s().length; K++) {
          const ie = s()[K];
          K == s().length - 1 ? F[ie] = { ...F[ie], [P]: H } : F = B[ie].children;
        }
      }
      return { [a()]: B };
    });
  }, g = (P) => {
    const H = P.target.value;
    d("name", H);
  }, p = (P) => {
    const H = P.value;
    d("dataType", H);
  };
  let x;
  const C = () => {
    f(l, (P) => {
      let H = P.data[a()];
      if (H && s().length > 0) {
        let I = H;
        for (let B = 0; B < s().length; B++) {
          const F = s()[B];
          B == s().length - 1 ? I.splice(F, 1) : I = I[F].children;
        }
      }
      return { [a()]: [...H] };
    }), x == null || x.hide();
  }, $ = () => {
    f(l, (P) => {
      let H = P.data[a()];
      if (H && s().length > 0) {
        let I = H;
        for (let B = 0; B < s().length; B++) {
          const F = s()[B];
          B == s().length - 1 ? I[F].children ? I[F].children.push({
            id: Rr(),
            name: "newParam",
            dataType: "String"
          }) : I[F].children = [
            {
              id: Rr(),
              name: "newParam",
              dataType: "String"
            }
          ] : I = I[F].children;
        }
      }
      return { [a()]: [...H] };
    });
  };
  var m = oy(), _ = be(m), v = X(_);
  {
    var b = (P) => {
      var H = et(), I = be(H);
      Yt(I, 17, s, Li, (B, F) => {
        Se();
        var K = Ie(" ");
        L(B, K);
      }), L(P, H);
    };
    ke(v, (P) => {
      s().length > 1 && P(b);
    });
  }
  var N = z(v, 2);
  const E = /* @__PURE__ */ Me(() => h(c).nameDisabled === !0);
  xt(N, {
    style: "width: 100%;",
    get value() {
      return h(c).name;
    },
    placeholder: "请输入参数名称",
    oninput: g,
    get disabled() {
      return h(E);
    }
  }), Z(_);
  var M = z(_, 2), D = X(M);
  const V = /* @__PURE__ */ Me(() => h(c).dataType ? [h(c).dataType] : []), A = /* @__PURE__ */ Me(() => h(c).dataTypeDisabled === !0);
  sn(D, {
    items: _d,
    style: "width: 100%",
    defaultValue: ["String"],
    get value() {
      return h(V);
    },
    get disabled() {
      return h(A);
    },
    onSelect: p
  });
  var O = z(D, 2);
  {
    var R = (P) => {
      Ke(P, {
        class: "input-btn-more",
        style: "margin-left: auto",
        onclick: $,
        children: (H, I) => {
          var B = ty();
          L(H, B);
        },
        $$slots: { default: !0 }
      });
    };
    ke(O, (P) => {
      (h(c).dataType === "Object" || h(c).dataType === "Array") && h(c).addChildDisabled !== !0 && P(R);
    });
  }
  Z(M);
  var S = z(M, 2), T = X(S);
  An(
    Lo(T, {
      placement: "bottom",
      floating: (H) => {
        var I = ry(), B = X(I), F = z(X(B));
        $t(F, {
          rows: 1,
          style: "width: 100%;",
          onchange: (ue) => {
            const me = ue.target.value;
            d("defaultValue", me);
          }
        }), Z(B);
        var K = z(B, 2), ie = z(X(K));
        $t(ie, {
          rows: 3,
          style: "width: 100%;",
          onchange: (ue) => {
            const me = ue.target.value;
            d("description", me);
          }
        }), Z(K);
        var ee = z(K, 2);
        {
          var W = (ue) => {
            var me = ny(), Ce = X(me);
            Ke(Ce, {
              onclick: C,
              children: (ge, ze) => {
                Se();
                var G = Ie("删除");
                L(ge, G);
              },
              $$slots: { default: !0 }
            }), Z(me), L(ue, me);
          };
          ke(ee, (ue) => {
            h(c).deleteDisabled !== !0 && ue(W);
          });
        }
        Z(I), L(H, I);
      },
      children: (H, I) => {
        Ui(H, {});
      },
      $$slots: { floating: !0, default: !0 }
    }),
    (H) => x = H,
    () => x
  ), Z(S), L(e, m);
  var k = fe({
    get parameter() {
      return i();
    },
    set parameter(P) {
      i(P), y();
    },
    get position() {
      return s();
    },
    set position(P) {
      s(P), y();
    },
    get dataKeyName() {
      return a();
    },
    set dataKeyName(P) {
      a(P), y();
    }
  });
  return r(), k;
}
ae(Pd, { parameter: {}, position: {}, dataKeyName: {} }, [], [], !0);
var sy = /* @__PURE__ */ ne("<!> <!>", 1), ay = /* @__PURE__ */ ne('<div class="none-params svelte-1sm1mgi"> </div>'), ly = /* @__PURE__ */ ne('<div class="input-header svelte-1sm1mgi">参数名称</div> <div class="input-header svelte-1sm1mgi">参数类型</div> <div class="input-header svelte-1sm1mgi"></div>', 1), uy = /* @__PURE__ */ ne('<div class="input-container svelte-1sm1mgi"><!> <!></div>');
const cy = {
  hash: "svelte-1sm1mgi",
  code: `.input-container.svelte-1sm1mgi {display:grid;grid-template-columns:40% 50% 10%;row-gap:5px;column-gap:3px;}.input-container.svelte-1sm1mgi .none-params:where(.svelte-1sm1mgi) {font-size:12px;background:#f8f8f8;height:40px;display:flex;justify-content:center;align-items:center;border-radius:5px;width:calc(100% - 5px);grid-column:1 / -1;
  /* 从第一列开始到最后一列结束 */}.input-container.svelte-1sm1mgi .input-header:where(.svelte-1sm1mgi) {font-size:12px;color:#666;}`
};
function Rn(e, t) {
  de(t, !0), Je(e, cy);
  const [n, r] = tt(), o = () => Q(h(u), "$node", n), i = (C, $ = dt, m = dt) => {
    var _ = et(), v = be(_);
    Yt(
      v,
      19,
      $,
      (b) => `${b.id}_${b.children ? b.children.length : 0}`,
      (b, N, E) => {
        var M = sy(), D = be(M);
        const V = /* @__PURE__ */ Me(() => [...m(), h(E)]);
        Pd(D, {
          get parameter() {
            return h(N);
          },
          get position() {
            return h(V);
          },
          get dataKeyName() {
            return a();
          }
        });
        var A = z(D, 2);
        {
          var O = (R) => {
            var S = /* @__PURE__ */ pe(() => [...m(), h(E)]);
            i(R, () => h(N).children, () => h(S));
          };
          ke(A, (R) => {
            h(N).children && R(O);
          });
        }
        L(b, M);
      },
      (b) => {
        var N = et(), E = be(N);
        {
          var M = (D) => {
            var V = ay(), A = X(V, !0);
            Z(V), Ee(() => Rt(A, s())), L(D, V);
          };
          ke(E, (D) => {
            m().length === 0 && D(M);
          });
        }
        L(b, N);
      }
    ), L(C, _);
  }, s = w(t, "noneParameterText", 7, "无输出参数"), a = w(t, "dataKeyName", 7, "outputDefs");
  let l = ht(), u = /* @__PURE__ */ Me(() => pr(l)), c = /* @__PURE__ */ Me(() => {
    var C;
    return [...((C = o()) == null ? void 0 : C.data[a()]) || []];
  });
  var f = uy(), d = X(f);
  {
    var g = (C) => {
      var $ = ly();
      Se(4), L(C, $);
    };
    ke(d, (C) => {
      h(c).length !== 0 && C(g);
    });
  }
  var p = z(d, 2);
  i(p, () => h(c) || [], () => []), Z(f), L(e, f);
  var x = fe({
    get noneParameterText() {
      return s();
    },
    set noneParameterText(C = "无输出参数") {
      s(C), y();
    },
    get dataKeyName() {
      return a();
    },
    set dataKeyName(C = "outputDefs") {
      a(C), y();
    }
  });
  return r(), x;
}
ae(Rn, { noneParameterText: {}, dataKeyName: {} }, [], [], !0);
var dy = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20.7134 7.12811L20.4668 7.69379C20.2864 8.10792 19.7136 8.10792 19.5331 7.69379L19.2866 7.12811C18.8471 6.11947 18.0555 5.31641 17.0677 4.87708L16.308 4.53922C15.8973 4.35653 15.8973 3.75881 16.308 3.57612L17.0252 3.25714C18.0384 2.80651 18.8442 1.97373 19.2761 0.930828L19.5293 0.319534C19.7058 -0.106511 20.2942 -0.106511 20.4706 0.319534L20.7238 0.930828C21.1558 1.97373 21.9616 2.80651 22.9748 3.25714L23.6919 3.57612C24.1027 3.75881 24.1027 4.35653 23.6919 4.53922L22.9323 4.87708C21.9445 5.31641 21.1529 6.11947 20.7134 7.12811ZM9 2C13.0675 2 16.426 5.03562 16.9337 8.96494L19.1842 12.5037C19.3324 12.7367 19.3025 13.0847 18.9593 13.2317L17 14.071V17C17 18.1046 16.1046 19 15 19H13.001L13 22H4L4.00025 18.3061C4.00033 17.1252 3.56351 16.0087 2.7555 15.0011C1.65707 13.6313 1 11.8924 1 10C1 5.58172 4.58172 2 9 2ZM9 4C5.68629 4 3 6.68629 3 10C3 11.3849 3.46818 12.6929 4.31578 13.7499C5.40965 15.114 6.00036 16.6672 6.00025 18.3063L6.00013 20H11.0007L11.0017 17H15V12.7519L16.5497 12.0881L15.0072 9.66262L14.9501 9.22118C14.5665 6.25141 12.0243 4 9 4ZM19.4893 16.9929L21.1535 18.1024C22.32 16.3562 23 14.2576 23 12.0001C23 11.317 22.9378 10.6486 22.8186 10L20.8756 10.5C20.9574 10.9878 21 11.489 21 12.0001C21 13.8471 20.4436 15.5642 19.4893 16.9929Z"></path></svg>'), fy = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z"></path></svg>'), gy = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z"></path></svg>'), hy = /* @__PURE__ */ ne('<div class="heading svelte-wn2kra"><!> <!></div> <!> <!> <div class="setting-title svelte-wn2kra">模型</div> <div class="setting-item svelte-wn2kra"><!> <!></div> <div class="setting-title svelte-wn2kra">采样参数</div> <div class="setting-item svelte-wn2kra"><div class="slider-container svelte-wn2kra"><label class="svelte-wn2kra"> </label> <input type="range" min="0" max="1" step="0.1" class="svelte-wn2kra"></div></div> <div class="setting-item svelte-wn2kra"><div class="slider-container svelte-wn2kra"><label class="svelte-wn2kra"> </label> <input type="range" min="0" max="1" step="0.1" class="svelte-wn2kra"></div></div> <div class="setting-item svelte-wn2kra"><div class="slider-container svelte-wn2kra"><label class="svelte-wn2kra"> </label> <input type="range" min="0" max="100" step="1" class="svelte-wn2kra"></div></div> <div class="setting-title svelte-wn2kra">系统提示词</div> <div class="setting-item svelte-wn2kra"><!></div> <div class="setting-title svelte-wn2kra">用户提示词</div> <div class="setting-item svelte-wn2kra"><!></div> <div class="heading svelte-wn2kra"><!> <!></div> <!>', 1);
const vy = {
  hash: "svelte-wn2kra",
  code: `.heading.svelte-wn2kra {display:flex;margin-bottom:10px;}.setting-title.svelte-wn2kra {font-size:12px;color:#999;margin-bottom:4px;margin-top:10px;}.setting-item.svelte-wn2kra {display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:10px;}\r
    /* 新增样式 */.slider-container.svelte-wn2kra {width:100%;display:flex;flex-direction:column;gap:4px;}.slider-container.svelte-wn2kra label:where(.svelte-wn2kra) {font-size:12px;color:#666;display:flex;justify-content:space-between;align-items:center;}input[type="range"].svelte-wn2kra {width:100%;height:4px;background:#ddd;border-radius:2px;outline:none;-webkit-appearance:none;}input[type="range"].svelte-wn2kra::-webkit-slider-thumb {-webkit-appearance:none;width:14px;height:14px;background:#007bff;border-radius:50%;cursor:pointer;}`
};
function Nd(e, t) {
  de(t, !0), Je(e, vy);
  const n = w(t, "data", 7), r = /* @__PURE__ */ yt(t, [
    "$$slots",
    "$$events",
    "$$legacy",
    "$$host",
    "data"
  ]), o = ht(), { addParameter: i } = kn(), s = Oo();
  let a = Un(Tt([]));
  un(async () => {
    var c, f;
    const u = await ((f = (c = s.provider) == null ? void 0 : c.llm) == null ? void 0 : f.call(c));
    h(a).push(...u || []);
  });
  const { updateNodeData: l } = Dt();
  return dn(e, ut(
    {
      get data() {
        return n();
      }
    },
    () => r,
    {
      icon: (c) => {
        var f = dy();
        L(c, f);
      },
      children: (c, f) => {
        var d = hy(), g = be(d), p = X(g);
        Ge(p, {
          level: 3,
          children: (G, se) => {
            Se();
            var Te = Ie("输入参数");
            L(G, Te);
          },
          $$slots: { default: !0 }
        });
        var x = z(p, 2);
        Ke(x, {
          class: "input-btn-more",
          style: "margin-left: auto",
          onclick: () => {
            i(o);
          },
          children: (G, se) => {
            var Te = fy();
            L(G, Te);
          },
          $$slots: { default: !0 }
        }), Z(g);
        var C = z(g, 2);
        zt(C, {});
        var $ = z(C, 2);
        Ge($, {
          level: 3,
          mt: "10px",
          children: (G, se) => {
            Se();
            var Te = Ie("模型设置");
            L(G, Te);
          },
          $$slots: { default: !0 }
        });
        var m = z($, 4), _ = X(m);
        const v = /* @__PURE__ */ Me(() => n().llmId ? [n().llmId] : []);
        sn(_, {
          get items() {
            return h(a);
          },
          style: "width: 100%",
          placeholder: "请选择模型",
          onSelect: (G) => {
            const se = G.value;
            l(o, () => ({ llmId: se }));
          },
          get value() {
            return h(v);
          }
        });
        var b = z(_, 2);
        Ui(b, {}), Z(m);
        var N = z(m, 4), E = X(N), M = X(E), D = X(M);
        Z(M);
        var V = z(M, 2);
        io(V), Z(E), Z(N);
        var A = z(N, 2), O = X(A), R = X(O), S = X(R);
        Z(R);
        var T = z(R, 2);
        io(T), Z(O), Z(A);
        var k = z(A, 2), P = X(k), H = X(P), I = X(H);
        Z(H);
        var B = z(H, 2);
        io(B), Z(P), Z(k);
        var F = z(k, 4), K = X(F);
        const ie = /* @__PURE__ */ Me(() => n().systemPrompt || "");
        $t(K, {
          rows: 5,
          placeholder: "请输入系统提示词",
          style: "width: 100%",
          get value() {
            return h(ie);
          },
          oninput: (G) => {
            l(o, { systemPrompt: G.target.value });
          }
        }), Z(F);
        var ee = z(F, 4), W = X(ee);
        const ue = /* @__PURE__ */ Me(() => n().userPrompt || "");
        $t(W, {
          rows: 5,
          placeholder: "请输入用户提示词",
          style: "width: 100%",
          get value() {
            return h(ue);
          },
          oninput: (G) => {
            l(o, { userPrompt: G.target.value });
          }
        }), Z(ee);
        var me = z(ee, 2), Ce = X(me);
        Ge(Ce, {
          level: 3,
          mt: "10px",
          children: (G, se) => {
            Se();
            var Te = Ie("输出参数");
            L(G, Te);
          },
          $$slots: { default: !0 }
        });
        var ge = z(Ce, 2);
        Ke(ge, {
          class: "input-btn-more",
          style: "margin-left: auto",
          onclick: () => {
            i(o, "outputDefs");
          },
          children: (G, se) => {
            var Te = gy();
            L(G, Te);
          },
          $$slots: { default: !0 }
        }), Z(me);
        var ze = z(me, 2);
        Rn(ze, {}), Ee(() => {
          Rt(D, `Temperature: ${n().temperature ?? 0.5}`), Qi(V, n().temperature ?? 0.5), Rt(S, `Top P: ${n().topP ?? 0.9}`), Qi(T, n().topP ?? 0.9), Rt(I, `Top K: ${n().topK ?? 50}`), Qi(B, n().topK ?? 50);
        }), Ye("mousedown", V, es(function(G) {
          Ve.call(this, t, G);
        })), Ye("input", V, (G) => l(o, { temperature: parseFloat(G.target.value) })), Ye("mousedown", T, es(function(G) {
          Ve.call(this, t, G);
        })), Ye("input", T, (G) => l(o, { topP: parseFloat(G.target.value) })), Ye("mousedown", B, es(function(G) {
          Ve.call(this, t, G);
        })), Ye("input", B, (G) => l(o, { topK: parseInt(G.target.value) })), L(c, d);
      },
      $$slots: { icon: !0, default: !0 }
    }
  )), fe({
    get data() {
      return n();
    },
    set data(u) {
      n(u), y();
    }
  });
}
ae(Nd, { data: {} }, [], [], !0);
var py = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M23 12L15.9289 19.0711L14.5147 17.6569L20.1716 12L14.5147 6.34317L15.9289 4.92896L23 12ZM3.82843 12L9.48528 17.6569L8.07107 19.0711L1 12L8.07107 4.92896L9.48528 6.34317L3.82843 12Z"></path></svg>'), my = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z"></path></svg>'), yy = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z"></path></svg>'), wy = /* @__PURE__ */ ne('<div class="heading svelte-15t2v24"><!> <!></div> <!> <!> <div class="setting-title svelte-15t2v24">执行引擎</div> <div class="setting-item svelte-15t2v24"><!></div> <div class="setting-title svelte-15t2v24">执行代码</div> <div class="setting-item svelte-15t2v24"><!></div> <div class="heading svelte-15t2v24"><!> <!></div> <!>', 1);
const _y = {
  hash: "svelte-15t2v24",
  code: ".heading.svelte-15t2v24 {display:flex;margin-bottom:10px;}.setting-title.svelte-15t2v24 {font-size:12px;color:#999;margin-bottom:4px;margin-top:10px;}.setting-item.svelte-15t2v24 {display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:10px;}"
};
function Md(e, t) {
  de(t, !0), Je(e, _y);
  const n = w(t, "data", 7), r = /* @__PURE__ */ yt(t, [
    "$$slots",
    "$$events",
    "$$legacy",
    "$$host",
    "data"
  ]), o = ht(), { addParameter: i } = kn(), { updateNodeData: s } = Dt(), a = [
    { label: "QLExpress", value: "qlexpress" },
    { label: "Groovy", value: "groovy" },
    { label: "JavaScript", value: "js" }
  ];
  return dn(e, ut(
    {
      get data() {
        return n();
      }
    },
    () => r,
    {
      icon: (u) => {
        var c = py();
        L(u, c);
      },
      children: (u, c) => {
        var f = wy(), d = be(f), g = X(d);
        Ge(g, {
          level: 3,
          children: (A, O) => {
            Se();
            var R = Ie("输入参数");
            L(A, R);
          },
          $$slots: { default: !0 }
        });
        var p = z(g, 2);
        Ke(p, {
          class: "input-btn-more",
          style: "margin-left: auto",
          onclick: () => {
            i(o);
          },
          children: (A, O) => {
            var R = my();
            L(A, R);
          },
          $$slots: { default: !0 }
        }), Z(d);
        var x = z(d, 2);
        zt(x, {});
        var C = z(x, 2);
        Ge(C, {
          level: 3,
          mt: "10px",
          children: (A, O) => {
            Se();
            var R = Ie("代码");
            L(A, R);
          },
          $$slots: { default: !0 }
        });
        var $ = z(C, 4), m = X($);
        const _ = /* @__PURE__ */ Me(() => n().engine ? [n().engine] : ["qlexpress"]);
        sn(m, {
          items: a,
          style: "width: 100%",
          placeholder: "请选择执行引擎",
          onSelect: (A) => {
            const O = A.value;
            s(o, () => ({ engine: O }));
          },
          get value() {
            return h(_);
          }
        }), Z($);
        var v = z($, 4), b = X(v);
        const N = /* @__PURE__ */ Me(() => n().code || "");
        $t(b, {
          rows: 10,
          placeholder: "请输入执行代码，注：输出内容需添加到_result中，如：_result.put(key, value)",
          style: "width: 100%",
          onchange: (A) => {
            s(o, () => ({ code: A.target.value }));
          },
          get value() {
            return h(N);
          }
        }), Z(v);
        var E = z(v, 2), M = X(E);
        Ge(M, {
          level: 3,
          mt: "10px",
          children: (A, O) => {
            Se();
            var R = Ie("输出参数");
            L(A, R);
          },
          $$slots: { default: !0 }
        });
        var D = z(M, 2);
        Ke(D, {
          class: "input-btn-more",
          style: "margin-left: auto",
          onclick: () => {
            i(o, "outputDefs");
          },
          children: (A, O) => {
            var R = yy();
            L(A, R);
          },
          $$slots: { default: !0 }
        }), Z(E);
        var V = z(E, 2);
        Rn(V, {}), L(u, f);
      },
      $$slots: { icon: !0, default: !0 }
    }
  )), fe({
    get data() {
      return n();
    },
    set data(l) {
      n(l), y();
    }
  });
}
ae(Md, { data: {} }, [], [], !0);
var xy = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M2 4C2 3.44772 2.44772 3 3 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4ZM4 5V19H20V5H4ZM7 8H17V11H15V10H13V14H14.5V16H9.5V14H11V10H9V11H7V8Z"></path></svg>'), by = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z"></path></svg>'), Cy = /* @__PURE__ */ ne('<div class="heading svelte-15t2v24"><!> <!></div> <!> <!> <div class="setting-title svelte-15t2v24">执行代码</div> <div class="setting-item svelte-15t2v24"><!></div> <div class="heading svelte-15t2v24"><!></div> <!>', 1);
const ky = {
  hash: "svelte-15t2v24",
  code: ".heading.svelte-15t2v24 {display:flex;margin-bottom:10px;}.setting-title.svelte-15t2v24 {font-size:12px;color:#999;margin-bottom:4px;margin-top:10px;}.setting-item.svelte-15t2v24 {display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:10px;}"
};
function Td(e, t) {
  de(t, !0), Je(e, ky);
  const n = w(t, "data", 7), r = /* @__PURE__ */ yt(t, [
    "$$slots",
    "$$events",
    "$$legacy",
    "$$host",
    "data"
  ]), o = ht(), { addParameter: i } = kn(), { updateNodeData: s } = Dt();
  return Nr(() => {
    (!n().outputDefs || n().outputDefs.length === 0) && i(o, "outputDefs", {
      name: "output",
      dataType: "String",
      dataTypeDisabled: !0,
      deleteDisabled: !0
    });
  }), dn(e, ut(
    {
      get data() {
        return n();
      }
    },
    () => r,
    {
      icon: (l) => {
        var u = xy();
        L(l, u);
      },
      children: (l, u) => {
        var c = Cy(), f = be(c), d = X(f);
        Ge(d, {
          level: 3,
          children: (N, E) => {
            Se();
            var M = Ie("输入参数");
            L(N, M);
          },
          $$slots: { default: !0 }
        });
        var g = z(d, 2);
        Ke(g, {
          class: "input-btn-more",
          style: "margin-left: auto",
          onclick: () => {
            i(o);
          },
          children: (N, E) => {
            var M = by();
            L(N, M);
          },
          $$slots: { default: !0 }
        }), Z(f);
        var p = z(f, 2);
        zt(p, {});
        var x = z(p, 2);
        Ge(x, {
          level: 3,
          mt: "10px",
          children: (N, E) => {
            Se();
            var M = Ie("代码");
            L(N, M);
          },
          $$slots: { default: !0 }
        });
        var C = z(x, 4), $ = X(C);
        const m = /* @__PURE__ */ Me(() => n().template || "");
        $t($, {
          rows: 10,
          placeholder: "请输入执行代码",
          style: "width: 100%",
          onchange: (N) => {
            s(o, () => ({ template: N.target.value }));
          },
          get value() {
            return h(m);
          }
        }), Z(C);
        var _ = z(C, 2), v = X(_);
        Ge(v, {
          level: 3,
          mt: "10px",
          children: (N, E) => {
            Se();
            var M = Ie("输出参数");
            L(N, M);
          },
          $$slots: { default: !0 }
        }), Z(_);
        var b = z(_, 2);
        Rn(b, {}), L(l, c);
      },
      $$slots: { icon: !0, default: !0 }
    }
  )), fe({
    get data() {
      return n();
    },
    set data(a) {
      n(a), y();
    }
  });
}
ae(Td, { data: {} }, [], [], !0);
var $y = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6.23509 6.45329C4.85101 7.89148 4 9.84636 4 12C4 16.4183 7.58172 20 12 20C13.0808 20 14.1116 19.7857 15.0521 19.3972C15.1671 18.6467 14.9148 17.9266 14.8116 17.6746C14.582 17.115 13.8241 16.1582 12.5589 14.8308C12.2212 14.4758 12.2429 14.2035 12.3636 13.3943L12.3775 13.3029C12.4595 12.7486 12.5971 12.4209 14.4622 12.1248C15.4097 11.9746 15.6589 12.3533 16.0043 12.8777C16.0425 12.9358 16.0807 12.9928 16.1198 13.0499C16.4479 13.5297 16.691 13.6394 17.0582 13.8064C17.2227 13.881 17.428 13.9751 17.7031 14.1314C18.3551 14.504 18.3551 14.9247 18.3551 15.8472V15.9518C18.3551 16.3434 18.3168 16.6872 18.2566 16.9859C19.3478 15.6185 20 13.8854 20 12C20 8.70089 18.003 5.8682 15.1519 4.64482C14.5987 5.01813 13.8398 5.54726 13.575 5.91C13.4396 6.09538 13.2482 7.04166 12.6257 7.11976C12.4626 7.14023 12.2438 7.12589 12.012 7.11097C11.3905 7.07058 10.5402 7.01606 10.268 7.75495C10.0952 8.2232 10.0648 9.49445 10.6239 10.1543C10.7134 10.2597 10.7307 10.4547 10.6699 10.6735C10.59 10.9608 10.4286 11.1356 10.3783 11.1717C10.2819 11.1163 10.0896 10.8931 9.95938 10.7412C9.64554 10.3765 9.25405 9.92233 8.74797 9.78176C8.56395 9.73083 8.36166 9.68867 8.16548 9.64736C7.6164 9.53227 6.99443 9.40134 6.84992 9.09302C6.74442 8.8672 6.74488 8.55621 6.74529 8.22764C6.74529 7.8112 6.74529 7.34029 6.54129 6.88256C6.46246 6.70541 6.35689 6.56446 6.23509 6.45329ZM12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22Z"></path></svg>'), Ey = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z"></path></svg>'), Sy = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z"></path></svg>'), Py = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z"></path></svg>'), Ny = /* @__PURE__ */ ne('<div class="heading svelte-1vtcqdz" style="padding-top: 10px"><!> <!></div> <!>', 1), My = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z"></path></svg>'), Ty = /* @__PURE__ */ ne('<div class="heading svelte-1vtcqdz" style="padding-top: 10px"><!> <!></div> <!>', 1), Hy = /* @__PURE__ */ ne('<div style="width: 100%"><!></div>'), Vy = /* @__PURE__ */ ne('<div style="width: 100%"><!></div>'), Dy = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z"></path></svg>'), Ay = /* @__PURE__ */ ne('<div style="display: flex;gap: 2px;width: 100%;padding: 10px 0"><div><!></div> <div style="width: 100%"><!></div></div> <div class="heading svelte-1vtcqdz"><!> <!></div> <!> <div class="heading svelte-1vtcqdz" style="padding-top: 10px"><!> <!></div> <!> <!> <div class="radio-group svelte-1vtcqdz"><label class="svelte-1vtcqdz"><!>none</label> <label class="svelte-1vtcqdz"><!>form-data</label> <label class="svelte-1vtcqdz"><!>x-www-form-urlencoded</label> <label class="svelte-1vtcqdz"><!>json</label> <label class="svelte-1vtcqdz"><!>raw</label></div> <!> <!> <!> <!> <div class="heading svelte-1vtcqdz"><!> <!></div> <!>', 1);
const Ly = {
  hash: "svelte-1vtcqdz",
  code: ".heading.svelte-1vtcqdz {display:flex;margin-bottom:10px;}.radio-group.svelte-1vtcqdz {display:flex;margin:10px 0;}.radio-group.svelte-1vtcqdz label:where(.svelte-1vtcqdz) {display:flex;font-size:14px;}"
};
function Hd(e, t) {
  de(t, !0), Je(e, Ly);
  const n = w(t, "data", 7), r = /* @__PURE__ */ yt(t, [
    "$$slots",
    "$$events",
    "$$legacy",
    "$$host",
    "data"
  ]), o = [
    { value: "get", label: "GET" },
    { value: "post", label: "POST" },
    { value: "put", label: "PUT" },
    { value: "delete", label: "DELETE" },
    { value: "head", label: "HEAD" },
    { value: "patch", label: "PATCH" }
  ], i = ht(), { addParameter: s } = kn(), { updateNodeData: a } = Dt();
  return dn(e, ut(
    {
      get data() {
        return n();
      }
    },
    () => r,
    {
      icon: (u) => {
        var c = $y();
        L(u, c);
      },
      children: (u, c) => {
        var f = Ay(), d = be(f), g = X(d), p = X(g);
        const x = /* @__PURE__ */ Me(() => n().method ? [n().method] : ["get"]);
        sn(p, {
          items: o,
          style: "width: 100%",
          placeholder: "请选择请求方式",
          onSelect: (oe) => {
            const ve = oe.value;
            a(i, () => ({ method: ve }));
          },
          get value() {
            return h(x);
          }
        }), Z(g);
        var C = z(g, 2), $ = X(C);
        const m = /* @__PURE__ */ Me(() => n().url || "");
        xt($, {
          placeholder: "请输入url",
          style: "width: 100%",
          onchange: (oe) => {
            a(i, () => ({ url: oe.target.value }));
          },
          get value() {
            return h(m);
          }
        }), Z(C), Z(d);
        var _ = z(d, 2), v = X(_);
        Ge(v, {
          level: 3,
          children: (oe, ve) => {
            Se();
            var xe = Ie("Http 头信息");
            L(oe, xe);
          },
          $$slots: { default: !0 }
        });
        var b = z(v, 2);
        Ke(b, {
          class: "input-btn-more",
          style: "margin-left: auto",
          onclick: () => {
            s(i, "headers");
          },
          children: (oe, ve) => {
            var xe = Ey();
            L(oe, xe);
          },
          $$slots: { default: !0 }
        }), Z(_);
        var N = z(_, 2);
        zt(N, { dataKeyName: "headers" });
        var E = z(N, 2), M = X(E);
        Ge(M, {
          level: 3,
          children: (oe, ve) => {
            Se();
            var xe = Ie("参数");
            L(oe, xe);
          },
          $$slots: { default: !0 }
        });
        var D = z(M, 2);
        Ke(D, {
          class: "input-btn-more",
          style: "margin-left: auto",
          onclick: () => {
            s(i, "urlParameters");
          },
          children: (oe, ve) => {
            var xe = Sy();
            L(oe, xe);
          },
          $$slots: { default: !0 }
        }), Z(E);
        var V = z(E, 2);
        zt(V, { dataKeyName: "urlParameters" });
        var A = z(V, 2);
        Ge(A, {
          level: 3,
          mt: "10px",
          children: (oe, ve) => {
            Se();
            var xe = Ie("Body");
            L(oe, xe);
          },
          $$slots: { default: !0 }
        });
        var O = z(A, 2), R = X(O), S = X(R);
        const T = /* @__PURE__ */ Me(() => !n().bodyType);
        xt(S, {
          type: "radio",
          name: "bodyType",
          value: "",
          get checked() {
            return h(T);
          },
          onchange: (oe) => {
            var ve;
            (ve = oe.target) != null && ve.checked && a(i, { bodyType: "" });
          }
        }), Se(), Z(R);
        var k = z(R, 2), P = X(k);
        const H = /* @__PURE__ */ Me(() => n().bodyType === "form-data");
        xt(P, {
          type: "radio",
          name: "bodyType",
          value: "form-data",
          get checked() {
            return h(H);
          },
          onchange: (oe) => {
            var ve;
            (ve = oe.target) != null && ve.checked && a(i, { bodyType: "form-data" });
          }
        }), Se(), Z(k);
        var I = z(k, 2), B = X(I);
        const F = /* @__PURE__ */ Me(() => n().bodyType === "x-www-form-urlencoded");
        xt(B, {
          type: "radio",
          name: "bodyType",
          value: "x-www-form-urlencoded",
          get checked() {
            return h(F);
          },
          onchange: (oe) => {
            var ve;
            (ve = oe.target) != null && ve.checked && a(i, { bodyType: "x-www-form-urlencoded" });
          }
        }), Se(), Z(I);
        var K = z(I, 2), ie = X(K);
        const ee = /* @__PURE__ */ Me(() => n().bodyType === "json");
        xt(ie, {
          type: "radio",
          name: "bodyType",
          value: "json",
          get checked() {
            return h(ee);
          },
          onchange: (oe) => {
            var ve;
            (ve = oe.target) != null && ve.checked && a(i, { bodyType: "json" });
          }
        }), Se(), Z(K);
        var W = z(K, 2), ue = X(W);
        const me = /* @__PURE__ */ Me(() => n().bodyType === "raw");
        xt(ue, {
          type: "radio",
          name: "bodyType",
          value: "raw",
          get checked() {
            return h(me);
          },
          onchange: (oe) => {
            var ve;
            (ve = oe.target) != null && ve.checked && a(i, { bodyType: "raw" });
          }
        }), Se(), Z(W), Z(O);
        var Ce = z(O, 2);
        {
          var ge = (oe) => {
            var ve = Ny(), xe = be(ve), Oe = X(xe);
            Ge(Oe, {
              level: 3,
              children: (J, Re) => {
                Se();
                var le = Ie("参数");
                L(J, le);
              },
              $$slots: { default: !0 }
            });
            var ct = z(Oe, 2);
            Ke(ct, {
              class: "input-btn-more",
              style: "margin-left: auto",
              onclick: () => {
                s(i, "fromData");
              },
              children: (J, Re) => {
                var le = Py();
                L(J, le);
              },
              $$slots: { default: !0 }
            }), Z(xe);
            var lt = z(xe, 2);
            zt(lt, { dataKeyName: "fromData" }), L(oe, ve);
          };
          ke(Ce, (oe) => {
            n().bodyType === "form-data" && oe(ge);
          });
        }
        var ze = z(Ce, 2);
        {
          var G = (oe) => {
            var ve = Ty(), xe = be(ve), Oe = X(xe);
            Ge(Oe, {
              level: 3,
              children: (J, Re) => {
                Se();
                var le = Ie("参数");
                L(J, le);
              },
              $$slots: { default: !0 }
            });
            var ct = z(Oe, 2);
            Ke(ct, {
              class: "input-btn-more",
              style: "margin-left: auto",
              onclick: () => {
                s(i, "fromUrlencoded");
              },
              children: (J, Re) => {
                var le = My();
                L(J, le);
              },
              $$slots: { default: !0 }
            }), Z(xe);
            var lt = z(xe, 2);
            zt(lt, { dataKeyName: "fromUrlencoded" }), L(oe, ve);
          };
          ke(ze, (oe) => {
            n().bodyType === "x-www-form-urlencoded" && oe(G);
          });
        }
        var se = z(ze, 2);
        {
          var Te = (oe) => {
            var ve = Hy(), xe = X(ve);
            $t(xe, {
              rows: "5",
              style: "width: 100%",
              placeholder: "请输入 json 信息",
              get value() {
                return n().bodyJson;
              },
              oninput: (Oe) => {
                a(i, { bodyJson: Oe.target.value });
              }
            }), Z(ve), L(oe, ve);
          };
          ke(se, (oe) => {
            n().bodyType === "json" && oe(Te);
          });
        }
        var Ae = z(se, 2);
        {
          var Xe = (oe) => {
            var ve = Vy(), xe = X(ve);
            $t(xe, {
              rows: "5",
              style: "width: 100%",
              placeholder: "请输入请求信息",
              get value() {
                return n().bodyRaw;
              },
              oninput: (Oe) => {
                a(i, { bodyRaw: Oe.target.value });
              }
            }), Z(ve), L(oe, ve);
          };
          ke(Ae, (oe) => {
            n().bodyType === "raw" && oe(Xe);
          });
        }
        var te = z(Ae, 2), Fe = X(te);
        Ge(Fe, {
          level: 3,
          mt: "10px",
          children: (oe, ve) => {
            Se();
            var xe = Ie("输出参数");
            L(oe, xe);
          },
          $$slots: { default: !0 }
        });
        var Le = z(Fe, 2);
        Ke(Le, {
          class: "input-btn-more",
          style: "margin-left: auto",
          onclick: () => {
            s(i, "outputDefs");
          },
          children: (oe, ve) => {
            var xe = Dy();
            L(oe, xe);
          },
          $$slots: { default: !0 }
        }), Z(te);
        var Qe = z(te, 2);
        Rn(Qe, {}), L(u, f);
      },
      $$slots: { icon: !0, default: !0 }
    }
  )), fe({
    get data() {
      return n();
    },
    set data(l) {
      n(l), y();
    }
  });
}
ae(Hd, { data: {} }, [], [], !0);
var Oy = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 5C13.567 5 12 6.567 12 8.5C12 10.433 13.567 12 15.5 12C17.433 12 19 10.433 19 8.5C19 6.567 17.433 5 15.5 5ZM10 8.5C10 5.46243 12.4624 3 15.5 3C18.5376 3 21 5.46243 21 8.5C21 9.6575 20.6424 10.7315 20.0317 11.6175L22.7071 14.2929L21.2929 15.7071L18.6175 13.0317C17.7315 13.6424 16.6575 14 15.5 14C12.4624 14 10 11.5376 10 8.5ZM3 4H8V6H3V4ZM3 11H8V13H3V11ZM21 18V20H3V18H21Z"></path></svg>'), Iy = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z"></path></svg>'), zy = /* @__PURE__ */ ne('<div class="heading svelte-15t2v24"><!> <!></div> <!> <!> <div class="setting-title svelte-15t2v24">知识库</div> <div class="setting-item svelte-15t2v24"><!></div> <div class="setting-title svelte-15t2v24">获取数据量</div> <div class="setting-item svelte-15t2v24"><!></div> <div class="heading svelte-15t2v24"><!></div> <!>', 1);
const Ry = {
  hash: "svelte-15t2v24",
  code: ".heading.svelte-15t2v24 {display:flex;margin-bottom:10px;}.setting-title.svelte-15t2v24 {font-size:12px;color:#999;margin-bottom:4px;margin-top:10px;}.setting-item.svelte-15t2v24 {display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:10px;}"
};
function Vd(e, t) {
  de(t, !0), Je(e, Ry);
  const n = w(t, "data", 7), r = /* @__PURE__ */ yt(t, [
    "$$slots",
    "$$events",
    "$$legacy",
    "$$host",
    "data"
  ]), o = ht(), { addParameter: i } = kn(), s = Oo();
  let a = Un(Tt([]));
  un(async () => {
    var c, f;
    const u = await ((f = (c = s.provider) == null ? void 0 : c.knowledge) == null ? void 0 : f.call(c));
    h(a).push(...u || []);
  });
  const { updateNodeData: l } = Dt();
  return Nr(() => {
    (!n().outputDefs || n().outputDefs.length === 0) && i(o, "outputDefs", {
      name: "documents",
      dataType: "Array",
      nameDisabled: !0,
      dataTypeDisabled: !0,
      addChildDisabled: !0,
      children: [
        {
          name: "title",
          dataType: "String",
          nameDisabled: !0,
          dataTypeDisabled: !0
        },
        {
          name: "content",
          dataType: "String",
          nameDisabled: !0,
          dataTypeDisabled: !0
        },
        {
          name: "documentId",
          dataType: "Number",
          nameDisabled: !0,
          dataTypeDisabled: !0
        },
        {
          name: "knowledgeId",
          dataType: "Number",
          nameDisabled: !0,
          dataTypeDisabled: !0
        }
      ]
    });
  }), dn(e, ut(
    {
      get data() {
        return n();
      }
    },
    () => r,
    {
      icon: (c) => {
        var f = Oy();
        L(c, f);
      },
      children: (c, f) => {
        var d = zy(), g = be(d), p = X(g);
        Ge(p, {
          level: 3,
          children: (V, A) => {
            Se();
            var O = Ie("输入参数");
            L(V, O);
          },
          $$slots: { default: !0 }
        });
        var x = z(p, 2);
        Ke(x, {
          class: "input-btn-more",
          style: "margin-left: auto",
          onclick: () => {
            i(o);
          },
          children: (V, A) => {
            var O = Iy();
            L(V, O);
          },
          $$slots: { default: !0 }
        }), Z(g);
        var C = z(g, 2);
        zt(C, {});
        var $ = z(C, 2);
        Ge($, {
          level: 3,
          mt: "10px",
          children: (V, A) => {
            Se();
            var O = Ie("知识库设置");
            L(V, O);
          },
          $$slots: { default: !0 }
        });
        var m = z($, 4), _ = X(m);
        const v = /* @__PURE__ */ Me(() => n().knowledgeId ? [n().knowledgeId] : []);
        sn(_, {
          get items() {
            return h(a);
          },
          style: "width: 100%",
          placeholder: "请选择知识库",
          onSelect: (V) => {
            const A = V.value;
            l(o, () => ({ knowledgeId: A }));
          },
          get value() {
            return h(v);
          }
        }), Z(m);
        var b = z(m, 4), N = X(b);
        xt(N, { placeholder: "搜索的数据条数", style: "width: 100%" }), Z(b);
        var E = z(b, 2), M = X(E);
        Ge(M, {
          level: 3,
          mt: "10px",
          children: (V, A) => {
            Se();
            var O = Ie("输出参数");
            L(V, O);
          },
          $$slots: { default: !0 }
        }), Z(E);
        var D = z(E, 2);
        Rn(D, {}), L(c, d);
      },
      $$slots: { icon: !0, default: !0 }
    }
  )), fe({
    get data() {
      return n();
    },
    set data(u) {
      n(u), y();
    }
  });
}
ae(Vd, { data: {} }, [], [], !0);
var By = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.263 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.263 15.0769 18.031 16.6168ZM16.0247 15.8748C17.2475 14.6146 18 12.8956 18 11C18 7.1325 14.8675 4 11 4C7.1325 4 4 7.1325 4 11C4 14.8675 7.1325 18 11 18C12.8956 18 14.6146 17.2475 15.8748 16.0247L16.0247 15.8748Z"></path></svg>'), Yy = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z"></path></svg>'), Zy = /* @__PURE__ */ ne('<div class="heading svelte-15t2v24"><!> <!></div> <!> <!> <div class="setting-title svelte-15t2v24">API 服务商</div> <div class="setting-item svelte-15t2v24"><!></div> <div class="setting-title svelte-15t2v24">API Key</div> <div class="setting-item svelte-15t2v24"><!></div> <div class="setting-title svelte-15t2v24">关键字</div> <div class="setting-item svelte-15t2v24"><!></div> <div class="setting-title svelte-15t2v24">数据量</div> <div class="setting-item svelte-15t2v24"><!></div> <div class="setting-title svelte-15t2v24">其他参数</div> <div class="setting-item svelte-15t2v24"><!></div> <div class="heading svelte-15t2v24"><!></div> <!>', 1);
const Xy = {
  hash: "svelte-15t2v24",
  code: ".heading.svelte-15t2v24 {display:flex;margin-bottom:10px;}.setting-title.svelte-15t2v24 {font-size:12px;color:#999;margin-bottom:4px;margin-top:10px;}.setting-item.svelte-15t2v24 {display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:10px;}"
};
function Dd(e, t) {
  de(t, !0), Je(e, Xy);
  const n = w(t, "data", 7), r = /* @__PURE__ */ yt(t, [
    "$$slots",
    "$$events",
    "$$legacy",
    "$$host",
    "data"
  ]), o = ht(), { addParameter: i } = kn(), s = Oo();
  let a = Un(Tt([]));
  un(async () => {
    var c;
    const u = await ((c = s.provider) == null ? void 0 : c.knowledge());
    h(a).push(...u || []);
  });
  const { updateNodeData: l } = Dt();
  return Nr(() => {
    (!n().outputDefs || n().outputDefs.length === 0) && i(o, "outputDefs", {
      name: "documents",
      dataType: "Array",
      nameDisabled: !0,
      dataTypeDisabled: !0,
      addChildDisabled: !0,
      children: [
        {
          name: "title",
          dataType: "String",
          nameDisabled: !0,
          dataTypeDisabled: !0
        },
        {
          name: "content",
          dataType: "String",
          nameDisabled: !0,
          dataTypeDisabled: !0
        },
        {
          name: "documentId",
          dataType: "Number",
          nameDisabled: !0,
          dataTypeDisabled: !0
        },
        {
          name: "knowledgeId",
          dataType: "Number",
          nameDisabled: !0,
          dataTypeDisabled: !0
        }
      ]
    });
  }), dn(e, ut(
    {
      get data() {
        return n();
      }
    },
    () => r,
    {
      icon: (c) => {
        var f = By();
        L(c, f);
      },
      children: (c, f) => {
        var d = Zy(), g = be(d), p = X(g);
        Ge(p, {
          level: 3,
          children: (k, P) => {
            Se();
            var H = Ie("输入参数");
            L(k, H);
          },
          $$slots: { default: !0 }
        });
        var x = z(p, 2);
        Ke(x, {
          class: "input-btn-more",
          style: "margin-left: auto",
          onclick: () => {
            i(o);
          },
          children: (k, P) => {
            var H = Yy();
            L(k, H);
          },
          $$slots: { default: !0 }
        }), Z(g);
        var C = z(g, 2);
        zt(C, {});
        var $ = z(C, 2);
        Ge($, {
          level: 3,
          mt: "10px",
          children: (k, P) => {
            Se();
            var H = Ie("搜索引擎设置");
            L(k, H);
          },
          $$slots: { default: !0 }
        });
        var m = z($, 4), _ = X(m);
        const v = /* @__PURE__ */ Me(() => n().knowledgeId ? [n().knowledgeId] : []);
        sn(_, {
          get items() {
            return h(a);
          },
          style: "width: 100%",
          placeholder: "请选择 API 服务商",
          onSelect: (k) => {
            const P = k.value;
            l(o, () => ({ knowledgeId: P }));
          },
          get value() {
            return h(v);
          }
        }), Z(m);
        var b = z(m, 4), N = X(b);
        xt(N, {
          placeholder: "请输入 API Key",
          style: "width: 100%"
        }), Z(b);
        var E = z(b, 4), M = X(E);
        xt(M, { placeholder: "请输入关键字", style: "width: 100%" }), Z(E);
        var D = z(E, 4), V = X(D);
        xt(V, { placeholder: "搜索的数据条数", style: "width: 100%" }), Z(D);
        var A = z(D, 4), O = X(A);
        $t(O, {
          rows: 3,
          placeholder: "请输入其他参数（Property 格式）",
          style: "width: 100%"
        }), Z(A);
        var R = z(A, 2), S = X(R);
        Ge(S, {
          level: 3,
          mt: "10px",
          children: (k, P) => {
            Se();
            var H = Ie("输出参数");
            L(k, H);
          },
          $$slots: { default: !0 }
        }), Z(R);
        var T = z(R, 2);
        Rn(T, {}), L(c, d);
      },
      $$slots: { icon: !0, default: !0 }
    }
  )), fe({
    get data() {
      return n();
    },
    set data(u) {
      n(u), y();
    }
  });
}
ae(Dd, { data: {} }, [], [], !0);
var Fy = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5.46257 4.43262C7.21556 2.91688 9.5007 2 12 2C17.5228 2 22 6.47715 22 12C22 14.1361 21.3302 16.1158 20.1892 17.7406L17 12H20C20 7.58172 16.4183 4 12 4C9.84982 4 7.89777 4.84827 6.46023 6.22842L5.46257 4.43262ZM18.5374 19.5674C16.7844 21.0831 14.4993 22 12 22C6.47715 22 2 17.5228 2 12C2 9.86386 2.66979 7.88416 3.8108 6.25944L7 12H4C4 16.4183 7.58172 20 12 20C14.1502 20 16.1022 19.1517 17.5398 17.7716L18.5374 19.5674Z"></path></svg>'), Wy = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z"></path></svg>'), Ky = /* @__PURE__ */ ne('<div class="heading svelte-md8tgj"><!> <!></div> <!> <div class="heading svelte-md8tgj"><!></div> <!>', 1);
const qy = {
  hash: "svelte-md8tgj",
  code: ".heading.svelte-md8tgj {display:flex;margin-bottom:10px;}.loop_handle_wrapper ::after {content:'循环体';width:100px;height:20px;background:#000;color:#fff;display:flex;justify-content:center;align-items:center;}"
};
function Ad(e, t) {
  de(t, !0), Je(e, qy);
  const n = w(t, "data", 7), r = /* @__PURE__ */ yt(t, [
    "$$slots",
    "$$events",
    "$$legacy",
    "$$host",
    "data"
  ]), o = ht(), { addParameter: i } = kn(), s = Oo();
  let a = Un(Tt([]));
  return un(async () => {
    var u;
    const l = await ((u = s.provider) == null ? void 0 : u.knowledge());
    h(a).push(...l || []);
  }), dn(e, ut(
    {
      get data() {
        return n();
      }
    },
    () => r,
    {
      icon: (c) => {
        var f = Fy();
        L(c, f);
      },
      handle: (c) => {
        Qn(c, {
          type: "source",
          get position() {
            return $e.Bottom;
          },
          id: "loop_handle",
          style: "bottom: -12px;width: 100px",
          class: "loop_handle_wrapper"
        });
      },
      children: (c, f) => {
        var d = Ky(), g = be(d), p = X(g);
        Ge(p, {
          level: 3,
          children: (v, b) => {
            Se();
            var N = Ie("循环变量");
            L(v, N);
          },
          $$slots: { default: !0 }
        });
        var x = z(p, 2);
        Ke(x, {
          class: "input-btn-more",
          style: "margin-left: auto",
          onclick: () => {
            i(o);
          },
          children: (v, b) => {
            var N = Wy();
            L(v, N);
          },
          $$slots: { default: !0 }
        }), Z(g);
        var C = z(g, 2);
        zt(C, {});
        var $ = z(C, 2), m = X($);
        Ge(m, {
          level: 3,
          mt: "10px",
          children: (v, b) => {
            Se();
            var N = Ie("输出参数");
            L(v, N);
          },
          $$slots: { default: !0 }
        }), Z($);
        var _ = z($, 2);
        Rn(_, {}), L(c, d);
      },
      $$slots: { icon: !0, handle: !0, default: !0 }
    }
  )), fe({
    get data() {
      return n();
    },
    set data(l) {
      n(l), y();
    }
  });
}
ae(Ad, { data: {} }, [], [], !0);
var Gy = /* @__PURE__ */ _e('<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="currentColor" p-id="2577" width="200" height="200"><path d="M312.096 408.576l67.84 67.84 45.312-45.216a32 32 0 0 1 45.248 45.248l-45.28 45.248 90.496 90.496 45.28-45.216a32 32 0 0 1 45.248 45.248l-45.248 45.248 67.904 67.872-90.528 90.528a224.064 224.064 0 0 1-292.544 21.024L176.32 906.368a32 32 0 0 1-45.248-45.248l69.504-69.472a224.064 224.064 0 0 1 21.024-292.576l90.496-90.496z m0 90.496L266.848 544.32a160 160 0 0 0-4.8 221.28l4.8 4.992a160 160 0 0 0 221.248 4.8l5.024-4.8 45.248-45.248-226.272-226.24z m610.272-384a32 32 0 0 1 0 45.248l-69.44 69.504a224.064 224.064 0 0 1-21.056 292.544l-90.528 90.528-316.8-316.8 90.56-90.496a224.064 224.064 0 0 1 292.544-21.024l69.44-69.504a32 32 0 0 1 45.28 0zM565.344 246.08l-5.024 4.8-45.248 45.248 226.272 226.272 45.248-45.248a160 160 0 0 0 4.8-221.28l-4.8-4.992a160 160 0 0 0-221.248-4.8z" p-id="2578"></path></svg>'), Uy = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z"></path></svg>'), jy = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z"></path></svg>'), Jy = /* @__PURE__ */ ne('<div class="heading svelte-15t2v24"><!> <!></div> <!> <!> <div class="setting-title svelte-15t2v24">选择内部接口</div> <div class="setting-item svelte-15t2v24"><!></div> <div class="heading svelte-15t2v24"><!> <!></div> <!>', 1);
const Qy = {
  hash: "svelte-15t2v24",
  code: ".heading.svelte-15t2v24 {display:flex;margin-bottom:10px;}.setting-title.svelte-15t2v24 {font-size:12px;color:#999;margin-bottom:4px;margin-top:10px;}.setting-item.svelte-15t2v24 {display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:10px;}"
};
function Ld(e, t) {
  de(t, !0), Je(e, Qy);
  const n = w(t, "data", 7), r = /* @__PURE__ */ yt(t, [
    "$$slots",
    "$$events",
    "$$legacy",
    "$$host",
    "data"
  ]), o = ht(), { addParameter: i } = kn(), { updateNodeData: s } = Dt(), a = Oo();
  let l = Un(Tt([]));
  return un(async () => {
    var c, f;
    const u = await ((f = (c = a.provider) == null ? void 0 : c.internal) == null ? void 0 : f.call(c));
    h(l).push(...u || []);
  }), dn(e, ut(
    {
      get data() {
        return n();
      }
    },
    () => r,
    {
      icon: (c) => {
        var f = Gy();
        L(c, f);
      },
      children: (c, f) => {
        var d = Jy(), g = be(d), p = X(g);
        Ge(p, {
          level: 3,
          children: (D, V) => {
            Se();
            var A = Ie("输入参数");
            L(D, A);
          },
          $$slots: { default: !0 }
        });
        var x = z(p, 2);
        Ke(x, {
          class: "input-btn-more",
          style: "margin-left: auto",
          onclick: () => {
            i(o);
          },
          children: (D, V) => {
            var A = Uy();
            L(D, A);
          },
          $$slots: { default: !0 }
        }), Z(g);
        var C = z(g, 2);
        zt(C, {});
        var $ = z(C, 2);
        Ge($, {
          level: 3,
          mt: "10px",
          children: (D, V) => {
            Se();
            var A = Ie("接口");
            L(D, A);
          },
          $$slots: { default: !0 }
        });
        var m = z($, 4), _ = X(m);
        const v = /* @__PURE__ */ Me(() => n().method ? [n().method] : [""]);
        sn(_, {
          get items() {
            return h(l);
          },
          style: "width: 100%",
          placeholder: "请选择内部接口",
          onSelect: (D) => {
            const V = D.value;
            s(o, () => ({ method: V }));
          },
          get value() {
            return h(v);
          }
        }), Z(m);
        var b = z(m, 2), N = X(b);
        Ge(N, {
          level: 3,
          mt: "10px",
          children: (D, V) => {
            Se();
            var A = Ie("输出参数");
            L(D, A);
          },
          $$slots: { default: !0 }
        });
        var E = z(N, 2);
        Ke(E, {
          class: "input-btn-more",
          style: "margin-left: auto",
          onclick: () => {
            i(o, "outputDefs");
          },
          children: (D, V) => {
            var A = jy();
            L(D, A);
          },
          $$slots: { default: !0 }
        }), Z(b);
        var M = z(b, 2);
        Rn(M, {}), L(c, d);
      },
      $$slots: { icon: !0, default: !0 }
    }
  )), fe({
    get data() {
      return n();
    },
    set data(u) {
      n(u), y();
    }
  });
}
ae(Ld, { data: {} }, [], [], !0);
const ew = {
  startNode: kd,
  codeNode: Md,
  llmNode: Nd,
  templateNode: Td,
  httpNode: Hd,
  knowledgeNode: Vd,
  searchEngineNode: Dd,
  loopNode: Ad,
  internalNode: Ld,
  endNode: Sd
};
var tw = /* @__PURE__ */ ne("<!> ", 1);
function Od(e, t) {
  de(t, !0);
  const n = w(t, "icon", 7), r = w(t, "title", 7), o = w(t, "type", 7), i = w(t, "description", 7), s = w(t, "extra", 7);
  return Ke(e, {
    draggable: !0,
    ondragstart: (l) => {
      if (!l.dataTransfer)
        return null;
      const u = {
        type: o(),
        data: {
          title: r(),
          description: i(),
          systemPrompt: "",
          userPrompt: "",
          ...s()
        }
      };
      l.dataTransfer.setData("application/tinyflow", JSON.stringify(u)), l.dataTransfer.effectAllowed = "move";
    },
    children: (l, u) => {
      var c = tw(), f = be(c);
      mu(f, n);
      var d = z(f);
      Ee(() => Rt(d, ` ${r() ?? ""}`)), L(l, c);
    },
    $$slots: { default: !0 }
  }), fe({
    get icon() {
      return n();
    },
    set icon(l) {
      n(l), y();
    },
    get title() {
      return r();
    },
    set title(l) {
      r(l), y();
    },
    get type() {
      return o();
    },
    set type(l) {
      o(l), y();
    },
    get description() {
      return i();
    },
    set description(l) {
      i(l), y();
    },
    get extra() {
      return s();
    },
    set extra(l) {
      s(l), y();
    }
  });
}
ae(
  Od,
  {
    icon: {},
    title: {},
    type: {},
    description: {},
    extra: {}
  },
  [],
  [],
  !0
);
var nw = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4.83582 12L11.0429 18.2071L12.4571 16.7929L7.66424 12L12.4571 7.20712L11.0429 5.79291L4.83582 12ZM10.4857 12L16.6928 18.2071L18.107 16.7929L13.3141 12L18.107 7.20712L16.6928 5.79291L10.4857 12Z"></path></svg>'), rw = /* @__PURE__ */ _e('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19.1642 12L12.9571 5.79291L11.5429 7.20712L16.3358 12L11.5429 16.7929L12.9571 18.2071L19.1642 12ZM13.5143 12L7.30722 5.79291L5.89301 7.20712L10.6859 12L5.89301 16.7929L7.30722 18.2071L13.5143 12Z"></path></svg>'), ow = /* @__PURE__ */ ne('<div><div class="tf-toolbar-container "><div class="tf-toolbar-container-header"><!></div> <div class="tf-toolbar-container-body"><div class="tf-toolbar-container-base"></div> <div class="tf-toolbar-container-tools"><!></div></div></div> <!></div>');
function Id(e) {
  let t = Un("base"), n = Un("show");
  const r = [
    {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12C15 13.6569 13.6569 15 12 15Z"></path></svg>',
      title: "开始节点",
      type: "startNode",
      description: "开始定义输入参数"
    },
    {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5.46257 4.43262C7.21556 2.91688 9.5007 2 12 2C17.5228 2 22 6.47715 22 12C22 14.1361 21.3302 16.1158 20.1892 17.7406L17 12H20C20 7.58172 16.4183 4 12 4C9.84982 4 7.89777 4.84827 6.46023 6.22842L5.46257 4.43262ZM18.5374 19.5674C16.7844 21.0831 14.4993 22 12 22C6.47715 22 2 17.5228 2 12C2 9.86386 2.66979 7.88416 3.8108 6.25944L7 12H4C4 16.4183 7.58172 20 12 20C14.1502 20 16.1022 19.1517 17.5398 17.7716L18.5374 19.5674Z"></path></svg>',
      title: "循环",
      type: "loopNode",
      description: "用于循环执行任务"
    },
    {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20.7134 7.12811L20.4668 7.69379C20.2864 8.10792 19.7136 8.10792 19.5331 7.69379L19.2866 7.12811C18.8471 6.11947 18.0555 5.31641 17.0677 4.87708L16.308 4.53922C15.8973 4.35653 15.8973 3.75881 16.308 3.57612L17.0252 3.25714C18.0384 2.80651 18.8442 1.97373 19.2761 0.930828L19.5293 0.319534C19.7058 -0.106511 20.2942 -0.106511 20.4706 0.319534L20.7238 0.930828C21.1558 1.97373 21.9616 2.80651 22.9748 3.25714L23.6919 3.57612C24.1027 3.75881 24.1027 4.35653 23.6919 4.53922L22.9323 4.87708C21.9445 5.31641 21.1529 6.11947 20.7134 7.12811ZM9 2C13.0675 2 16.426 5.03562 16.9337 8.96494L19.1842 12.5037C19.3324 12.7367 19.3025 13.0847 18.9593 13.2317L17 14.071V17C17 18.1046 16.1046 19 15 19H13.001L13 22H4L4.00025 18.3061C4.00033 17.1252 3.56351 16.0087 2.7555 15.0011C1.65707 13.6313 1 11.8924 1 10C1 5.58172 4.58172 2 9 2ZM9 4C5.68629 4 3 6.68629 3 10C3 11.3849 3.46818 12.6929 4.31578 13.7499C5.40965 15.114 6.00036 16.6672 6.00025 18.3063L6.00013 20H11.0007L11.0017 17H15V12.7519L16.5497 12.0881L15.0072 9.66262L14.9501 9.22118C14.5665 6.25141 12.0243 4 9 4ZM19.4893 16.9929L21.1535 18.1024C22.32 16.3562 23 14.2576 23 12.0001C23 11.317 22.9378 10.6486 22.8186 10L20.8756 10.5C20.9574 10.9878 21 11.489 21 12.0001C21 13.8471 20.4436 15.5642 19.4893 16.9929Z"></path></svg>',
      title: "大模型",
      type: "llmNode",
      description: "使用大模型处理问题"
    },
    {
      // icon:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4.7134 7.12811L4.46682 7.69379C4.28637 8.10792 3.71357 8.10792 3.53312 7.69379L3.28656 7.12811C2.84706 6.11947 2.05545 5.31641 1.06767 4.87708L0.308047 4.53922C-0.102682 4.35653 -0.102682 3.75881 0.308047 3.57612L1.0252 3.25714C2.03838 2.80651 2.84417 1.97373 3.27612 0.930828L3.52932 0.319534C3.70578 -0.106511 4.29417 -0.106511 4.47063 0.319534L4.72382 0.930828C5.15577 1.97373 5.96158 2.80651 6.9748 3.25714L7.69188 3.57612C8.10271 3.75881 8.10271 4.35653 7.69188 4.53922L6.93228 4.87708C5.94451 5.31641 5.15288 6.11947 4.7134 7.12811ZM6.33421 15.8154C6.51032 15.233 6.7072 14.6562 6.93912 14.0327C8.99484 8.50636 12.4197 5.08172 18.0129 4.21479C17.5 5.35838 17.0151 6.15301 16.5858 6.58237C16.2521 6.91603 15.9185 7.24993 15.5848 7.58407L14.1721 8.99878L15.6279 10.4535C14.4976 12.5384 12.2652 14.1979 9.75193 14.512C8.43544 14.6766 7.29345 15.1188 6.33421 15.8154ZM18 9.99658L17 8.99728C17.3331 8.66372 17.6662 8.33039 18.0027 7.99391C19.0018 6.99303 20.0009 4.99392 21 1.99658C6.31105 1.99658 4.08854 15.422 3.06361 21.6132C3.0419 21.7443 3.02074 21.8722 3 21.9966H4.99824C5.66421 18.6635 7.33146 16.8301 10 16.4966C14 15.9966 17 12.9966 18 9.99658Z"></path></svg>',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 5C13.567 5 12 6.567 12 8.5C12 10.433 13.567 12 15.5 12C17.433 12 19 10.433 19 8.5C19 6.567 17.433 5 15.5 5ZM10 8.5C10 5.46243 12.4624 3 15.5 3C18.5376 3 21 5.46243 21 8.5C21 9.6575 20.6424 10.7315 20.0317 11.6175L22.7071 14.2929L21.2929 15.7071L18.6175 13.0317C17.7315 13.6424 16.6575 14 15.5 14C12.4624 14 10 11.5376 10 8.5ZM3 4H8V6H3V4ZM3 11H8V13H3V11ZM21 18V20H3V18H21Z"></path></svg>',
      title: "知识库",
      type: "knowledgeNode",
      description: "通过知识库获取内容"
    },
    {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.263 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.263 15.0769 18.031 16.6168ZM16.0247 15.8748C17.2475 14.6146 18 12.8956 18 11C18 7.1325 14.8675 4 11 4C7.1325 4 4 7.1325 4 11C4 14.8675 7.1325 18 11 18C12.8956 18 14.6146 17.2475 15.8748 16.0247L16.0247 15.8748Z"></path></svg>',
      title: "搜索引擎",
      type: "searchEngineNode",
      description: "通过搜索引擎搜索内容"
    },
    {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6.23509 6.45329C4.85101 7.89148 4 9.84636 4 12C4 16.4183 7.58172 20 12 20C13.0808 20 14.1116 19.7857 15.0521 19.3972C15.1671 18.6467 14.9148 17.9266 14.8116 17.6746C14.582 17.115 13.8241 16.1582 12.5589 14.8308C12.2212 14.4758 12.2429 14.2035 12.3636 13.3943L12.3775 13.3029C12.4595 12.7486 12.5971 12.4209 14.4622 12.1248C15.4097 11.9746 15.6589 12.3533 16.0043 12.8777C16.0425 12.9358 16.0807 12.9928 16.1198 13.0499C16.4479 13.5297 16.691 13.6394 17.0582 13.8064C17.2227 13.881 17.428 13.9751 17.7031 14.1314C18.3551 14.504 18.3551 14.9247 18.3551 15.8472V15.9518C18.3551 16.3434 18.3168 16.6872 18.2566 16.9859C19.3478 15.6185 20 13.8854 20 12C20 8.70089 18.003 5.8682 15.1519 4.64482C14.5987 5.01813 13.8398 5.54726 13.575 5.91C13.4396 6.09538 13.2482 7.04166 12.6257 7.11976C12.4626 7.14023 12.2438 7.12589 12.012 7.11097C11.3905 7.07058 10.5402 7.01606 10.268 7.75495C10.0952 8.2232 10.0648 9.49445 10.6239 10.1543C10.7134 10.2597 10.7307 10.4547 10.6699 10.6735C10.59 10.9608 10.4286 11.1356 10.3783 11.1717C10.2819 11.1163 10.0896 10.8931 9.95938 10.7412C9.64554 10.3765 9.25405 9.92233 8.74797 9.78176C8.56395 9.73083 8.36166 9.68867 8.16548 9.64736C7.6164 9.53227 6.99443 9.40134 6.84992 9.09302C6.74442 8.8672 6.74488 8.55621 6.74529 8.22764C6.74529 7.8112 6.74529 7.34029 6.54129 6.88256C6.46246 6.70541 6.35689 6.56446 6.23509 6.45329ZM12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22Z"></path></svg>',
      title: "Http 请求",
      type: "httpNode",
      description: "通过 HTTP 请求获取数据"
    },
    {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M23 12L15.9289 19.0711L14.5147 17.6569L20.1716 12L14.5147 6.34317L15.9289 4.92896L23 12ZM3.82843 12L9.48528 17.6569L8.07107 19.0711L1 12L8.07107 4.92896L9.48528 6.34317L3.82843 12Z"></path></svg>',
      title: "动态代码",
      type: "codeNode",
      description: "动态执行代码"
    },
    {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M2 4C2 3.44772 2.44772 3 3 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4ZM4 5V19H20V5H4ZM7 8H17V11H15V10H13V14H14.5V16H9.5V14H11V10H9V11H7V8Z"></path></svg>',
      title: "内容模板",
      type: "templateNode",
      description: "通过模板引擎生成内容"
    },
    {
      icon: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="currentColor" p-id="2577" width="200" height="200"><path d="M312.096 408.576l67.84 67.84 45.312-45.216a32 32 0 0 1 45.248 45.248l-45.28 45.248 90.496 90.496 45.28-45.216a32 32 0 0 1 45.248 45.248l-45.248 45.248 67.904 67.872-90.528 90.528a224.064 224.064 0 0 1-292.544 21.024L176.32 906.368a32 32 0 0 1-45.248-45.248l69.504-69.472a224.064 224.064 0 0 1 21.024-292.576l90.496-90.496z m0 90.496L266.848 544.32a160 160 0 0 0-4.8 221.28l4.8 4.992a160 160 0 0 0 221.248 4.8l5.024-4.8 45.248-45.248-226.272-226.24z m610.272-384a32 32 0 0 1 0 45.248l-69.44 69.504a224.064 224.064 0 0 1-21.056 292.544l-90.528 90.528-316.8-316.8 90.56-90.496a224.064 224.064 0 0 1 292.544-21.024l69.44-69.504a32 32 0 0 1 45.28 0zM565.344 246.08l-5.024 4.8-45.248 45.248 226.272 226.272 45.248-45.248a160 160 0 0 0 4.8-221.28l-4.8-4.992a160 160 0 0 0-221.248-4.8z" p-id="2578"></path></svg>',
      title: "内部接口",
      type: "internalNode",
      description: "执行内部提供接口"
    },
    {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5.1438V16.0002H18.3391L6 5.1438ZM4 2.932C4 2.07155 5.01456 1.61285 5.66056 2.18123L21.6501 16.2494C22.3423 16.8584 21.9116 18.0002 20.9896 18.0002H6V22H4V2.932Z"></path></svg>',
      title: "结束节点",
      type: "endNode",
      description: "结束定义输出参数"
    }
  ], o = [
    {
      label: "基础节点",
      value: "base"
    },
    {
      label: "业务工具",
      value: "tools"
    }
  ];
  var i = ow(), s = X(i), a = X(s), l = X(a);
  sd(l, {
    style: "width: 100%",
    items: o,
    onChange: (p) => {
      U(t, Tt(p.value.toString()));
    }
  }), Z(a);
  var u = z(a, 2), c = X(u);
  Yt(c, 21, () => r, Li, (p, x) => {
    Od(p, ut(() => h(x)));
  }), Z(c);
  var f = z(c, 2), d = X(f);
  Ke(d, {
    children: (p, x) => {
      Se();
      var C = Ie("测试业务按钮");
      L(p, C);
    },
    $$slots: { default: !0 }
  }), Z(f), Z(u), Z(s);
  var g = z(s, 2);
  Ke(g, {
    onclick: () => {
      U(n, Tt(h(n) ? "" : "show"));
    },
    children: (p, x) => {
      var C = et(), $ = be(C);
      {
        var m = (v) => {
          var b = nw();
          L(v, b);
        }, _ = (v) => {
          var b = rw();
          L(v, b);
        };
        ke($, (v) => {
          h(n) === "show" ? v(m) : v(_, !1);
        });
      }
      L(p, C);
    },
    $$slots: { default: !0 }
  }), Z(i), Ee(() => {
    kt(i, 1, `tf-toolbar ${h(n) ?? ""}`), ce(c, "style", `display: ${(h(t) === "base" ? "flex" : "none") ?? ""}`), ce(f, "style", `display: ${(h(t) !== "base" ? "flex" : "none") ?? ""}`);
  }), L(e, i);
}
ae(Id, {}, [], [], !0);
const iw = () => {
  const { nodeLookup: e } = Ue();
  return {
    getNode: (n) => {
      var o;
      return (o = q(e).get(n)) == null ? void 0 : o.internals.userNode;
    }
  };
}, sw = () => {
  const { nodes: e } = Ue();
  return {
    ensureParentInNodesBefore: (n, r) => {
      e.update((o) => {
        let i = -1;
        for (let l = 0; l < o.length; l++)
          if (o[l].id === n) {
            i = l;
            break;
          }
        if (i <= 0)
          return o;
        let s = -1;
        for (let l = 0; l < i; l++)
          if (o[l].parentId === n || o[l].id === r) {
            s = l;
            break;
          }
        if (s == -1)
          return o;
        const a = o[i];
        for (let l = i; l > s; l--)
          o[l] = o[l - 1];
        return o[s] = a, o;
      });
    }
  };
}, aw = () => {
  const { edges: e } = Ue();
  return {
    getEdgesByTarget: (n) => q(e).filter((o) => o.target === n)
  };
};
var lw = /* @__PURE__ */ ne('<div class="panel-content svelte-1oe15vw"><div>边属性设置</div> <div class="setting-title svelte-1oe15vw">边条件设置</div> <div class="setting-item"><!></div></div>'), uw = /* @__PURE__ */ ne("<!> <!> <!> <!>", 1), cw = /* @__PURE__ */ ne('<div style="position: relative; height: 100%; width: 100%"><!> <!></div>');
const dw = {
  hash: "svelte-1oe15vw",
  code: ".panel-content.svelte-1oe15vw {padding:10px;background-color:#fff;border-radius:5px;box-shadow:0 2px 4px rgba(0, 0, 0, 0.1);width:200px;border:1px solid #efefef;}.setting-title.svelte-1oe15vw {margin:10px 0;font-size:12px;color:#999;}"
};
function zd(e, t) {
  de(t, !0), Je(e, dw);
  const n = w(t, "onInit", 7), r = Dt();
  n()(r);
  let o = Un(!1);
  const i = (_) => {
    _.preventDefault(), _.dataTransfer && (_.dataTransfer.dropEffect = "move");
  }, s = (_) => {
    var M;
    _.preventDefault();
    const v = r.screenToFlowPosition({
      x: _.clientX - 250,
      y: _.clientY - 100
    }), b = (M = _.dataTransfer) == null ? void 0 : M.getData("application/tinyflow"), N = b ? JSON.parse(b) : {}, E = {
      id: `node_${Rr()}`,
      position: v,
      data: {},
      ...N
    };
    ei.addNode(E), ei.selectNodeOnly(E.id);
  }, { getNode: a } = iw(), l = (_) => {
    const v = a(_.source), b = a(_.target);
    if (_.sourceHandle === "loop_handle" || v.parentId) {
      const N = r.getEdges();
      for (let E of N)
        if (E.target === _.target) {
          const M = a(E.source);
          if (_.sourceHandle === "loop_handle" && M.parentId !== v.id || v.parentId && M.parentId !== v.parentId)
            return !1;
        }
    }
    return !(!v.parentId && b.parentId && b.parentId !== v.id);
  }, { ensureParentInNodesBefore: u } = sw(), c = (_, v) => {
    if (!v.isValid)
      return;
    const b = v.toNode;
    if (b.parentId)
      return;
    const N = v.fromNode, E = v.fromHandle, M = { position: { ...b.position } };
    if (E.id === "loop_handle" ? M.parentId = N.id : N.parentId && (M.parentId = N.parentId), M.parentId) {
      const D = a(M.parentId);
      M.position = {
        x: b.position.x - D.position.x,
        y: b.position.y - D.position.y
      }, u(M.parentId, b.id), r.updateNode(b.id, M);
    }
  }, { getEdgesByTarget: f } = aw(), d = (_) => {
    _.edges.forEach((b) => {
      const N = a(b.target);
      if (N.parentId) {
        const E = f(b.target), M = a(N.parentId);
        if (E.length === 0)
          r.updateNode(N.id, {
            parentId: void 0,
            position: {
              x: N.position.x + M.position.x,
              y: N.position.y + M.position.y
            }
          });
        else {
          let D = !1;
          for (let V = 0; V < E.length; V++) {
            const A = E[V], O = a(A.source);
            if (O.parentId || O.type === "loopNode") {
              D = !0;
              break;
            }
          }
          D || r.updateNode(N.id, {
            parentId: void 0,
            position: {
              x: N.position.x + M.position.x,
              y: N.position.y + M.position.y
            }
          });
        }
      }
    });
  }, g = (_, v) => {
    console.log("onconnectstart: ", _, v);
  }, p = (_) => {
    console.log("onconnect: ", _);
  };
  var x = cw(), C = X(x);
  Id(C);
  var $ = z(C, 2);
  const m = /* @__PURE__ */ Me(() => ({
    // animated: true,
    // label: 'edge label',
    markerEnd: {
      type: mo.ArrowClosed,
      // color: 'red',
      width: 20,
      height: 20
    }
  }));
  return Fc($, ut({ nodeTypes: ew }, ei, {
    class: "tinyflow-logo",
    isValidConnection: l,
    onconnectend: c,
    onconnectstart: g,
    onconnect: p,
    connectionRadius: 50,
    ondelete: d,
    onclick: (_) => {
      const v = _.target;
      v.classList.contains("svelte-flow__edge-interaction") || v.classList.contains("panel-content") || v.closest(".panel-content") || U(o, !1);
    },
    get defaultEdgeOptions() {
      return h(m);
    },
    $$events: {
      drop: s,
      dragover: i,
      edgeclick: () => {
        U(o, !0);
      }
    },
    children: (_, v) => {
      var b = uw(), N = be(b);
      td(N, {});
      var E = z(N, 2);
      Jc(E, {});
      var M = z(E, 2);
      rd(M, {});
      var D = z(M, 2);
      {
        var V = (A) => {
          Ho(A, {
            children: (O, R) => {
              var S = lw(), T = z(X(S), 4), k = X(T);
              $t(k, {
                rows: 3,
                placeholder: "请输入边条件",
                style: "width: 100%",
                oninput: (P) => {
                }
              }), Z(T), Z(S), L(O, S);
            },
            $$slots: { default: !0 }
          });
        };
        ke(D, (A) => {
          h(o) && A(V);
        });
      }
      L(_, b);
    },
    $$slots: { default: !0 }
  })), Z(x), L(e, x), fe({
    get onInit() {
      return n();
    },
    set onInit(_) {
      n(_), y();
    }
  });
}
ae(zd, { onInit: {} }, [], [], !0);
function fw(e, t) {
  de(t, !0);
  const n = w(t, "options", 7), r = w(t, "onInit", 7), { data: o } = n();
  return ei.init((o == null ? void 0 : o.nodes) || [], (o == null ? void 0 : o.edges) || []), Tr("tinyflow_options", n()), Wc(e, {
    fitView: !0,
    children: (i, s) => {
      zd(i, {
        get onInit() {
          return r();
        }
      });
    },
    $$slots: { default: !0 }
  }), fe({
    get options() {
      return n();
    },
    set options(i) {
      n(i), y();
    },
    get onInit() {
      return r();
    },
    set onInit(i) {
      r(i), y();
    }
  });
}
customElements.define("tinyflow-component", ae(fw, { options: {}, onInit: {} }, [], [], !1));
export {
  yw as Tinyflow
};
//# sourceMappingURL=index.js.map
