(function () {
    const i = document.createElement("link").relList;
    if (i && i.supports && i.supports("modulepreload")) return;
    for (const o of document.querySelectorAll('link[rel="modulepreload"]')) u(o);
    new MutationObserver(o => {
        for (const f of o) if (f.type === "childList") for (const d of f.addedNodes) d.tagName === "LINK" && d.rel === "modulepreload" && u(d)
    }).observe(document, {childList: !0, subtree: !0});

    function r(o) {
        const f = {};
        return o.integrity && (f.integrity = o.integrity), o.referrerPolicy && (f.referrerPolicy = o.referrerPolicy), o.crossOrigin === "use-credentials" ? f.credentials = "include" : o.crossOrigin === "anonymous" ? f.credentials = "omit" : f.credentials = "same-origin", f
    }

    function u(o) {
        if (o.ep) return;
        o.ep = !0;
        const f = r(o);
        fetch(o.href, f)
    }
})();

function H0(n) {
    return n && n.__esModule && Object.prototype.hasOwnProperty.call(n, "default") ? n.default : n
}

var Hc = {exports: {}}, dr = {};
var Qp;

function V0() {
    if (Qp) return dr;
    Qp = 1;
    var n = Symbol.for("react.transitional.element"), i = Symbol.for("react.fragment");

    function r(u, o, f) {
        var d = null;
        if (f !== void 0 && (d = "" + f), o.key !== void 0 && (d = "" + o.key), "key" in o) {
            f = {};
            for (var m in o) m !== "key" && (f[m] = o[m])
        } else f = o;
        return o = f.ref, {$$typeof: n, type: u, key: d, ref: o !== void 0 ? o : null, props: f}
    }

    return dr.Fragment = i, dr.jsx = r, dr.jsxs = r, dr
}

var Yp;

function $0() {
    return Yp || (Yp = 1, Hc.exports = V0()), Hc.exports
}

var p = $0(), ml = class {
    constructor() {
        this.listeners = new Set, this.subscribe = this.subscribe.bind(this)
    }

    subscribe(n) {
        return this.listeners.add(n), this.onSubscribe(), () => {
            this.listeners.delete(n), this.onUnsubscribe()
        }
    }

    hasListeners() {
        return this.listeners.size > 0
    }

    onSubscribe() {
    }

    onUnsubscribe() {
    }
}, Q0 = class extends ml {
    #e;
    #t;
    #n;

    constructor() {
        super(), this.#n = n => {
            if (typeof window < "u" && window.addEventListener) {
                const i = () => n();
                return window.addEventListener("visibilitychange", i, !1), () => {
                    window.removeEventListener("visibilitychange", i)
                }
            }
        }
    }

    onSubscribe() {
        this.#t || this.setEventListener(this.#n)
    }

    onUnsubscribe() {
        this.hasListeners() || (this.#t?.(), this.#t = void 0)
    }

    setEventListener(n) {
        this.#n = n, this.#t?.(), this.#t = n(i => {
            typeof i == "boolean" ? this.setFocused(i) : this.onFocus()
        })
    }

    setFocused(n) {
        this.#e !== n && (this.#e = n, this.onFocus())
    }

    onFocus() {
        const n = this.isFocused();
        this.listeners.forEach(i => {
            i(n)
        })
    }

    isFocused() {
        return typeof this.#e == "boolean" ? this.#e : globalThis.document?.visibilityState !== "hidden"
    }
}, bf = new Q0, Y0 = {
    setTimeout: (n, i) => setTimeout(n, i),
    clearTimeout: n => clearTimeout(n),
    setInterval: (n, i) => setInterval(n, i),
    clearInterval: n => clearInterval(n)
}, G0 = class {
    #e = Y0;
    #t = !1;

    setTimeoutProvider(n) {
        this.#e = n
    }

    setTimeout(n, i) {
        return this.#e.setTimeout(n, i)
    }

    clearTimeout(n) {
        this.#e.clearTimeout(n)
    }

    setInterval(n, i) {
        return this.#e.setInterval(n, i)
    }

    clearInterval(n) {
        this.#e.clearInterval(n)
    }
}, hi = new G0;

function F0(n) {
    setTimeout(n, 0)
}

var X0 = typeof window > "u" || "Deno" in globalThis;

function Ht() {
}

function J0(n, i) {
    return typeof n == "function" ? n(i) : n
}

function tf(n) {
    return typeof n == "number" && n >= 0 && n !== 1 / 0
}

function sv(n, i) {
    return Math.max(n + (i || 0) - Date.now(), 0)
}

function $a(n, i) {
    return typeof n == "function" ? n(i) : n
}

function cn(n, i) {
    return typeof n == "function" ? n(i) : n
}

function Gp(n, i) {
    const {type: r = "all", exact: u, fetchStatus: o, predicate: f, queryKey: d, stale: m} = n;
    if (d) {
        if (u) {
            if (i.queryHash !== _f(d, i.options)) return !1
        } else if (!Sr(i.queryKey, d)) return !1
    }
    if (r !== "all") {
        const y = i.isActive();
        if (r === "active" && !y || r === "inactive" && y) return !1
    }
    return !(typeof m == "boolean" && i.isStale() !== m || o && o !== i.state.fetchStatus || f && !f(i))
}

function Fp(n, i) {
    const {exact: r, status: u, predicate: o, mutationKey: f} = n;
    if (f) {
        if (!i.options.mutationKey) return !1;
        if (r) {
            if (yi(i.options.mutationKey) !== yi(f)) return !1
        } else if (!Sr(i.options.mutationKey, f)) return !1
    }
    return !(u && i.state.status !== u || o && !o(i))
}

function _f(n, i) {
    return (i?.queryKeyHashFn || yi)(n)
}

function yi(n) {
    return JSON.stringify(n, (i, r) => nf(r) ? Object.keys(r).sort().reduce((u, o) => (u[o] = r[o], u), {}) : r)
}

function Sr(n, i) {
    return n === i ? !0 : typeof n != typeof i ? !1 : n && i && typeof n == "object" && typeof i == "object" ? Object.keys(i).every(r => Sr(n[r], i[r])) : !1
}

var K0 = Object.prototype.hasOwnProperty;

function ov(n, i, r = 0) {
    if (n === i) return n;
    if (r > 500) return i;
    const u = Xp(n) && Xp(i);
    if (!u && !(nf(n) && nf(i))) return i;
    const f = (u ? n : Object.keys(n)).length, d = u ? i : Object.keys(i), m = d.length, y = u ? new Array(m) : {};
    let v = 0;
    for (let b = 0; b < m; b++) {
        const S = u ? b : d[b], T = n[S], R = i[S];
        if (T === R) {
            y[S] = T, (u ? b < f : K0.call(n, S)) && v++;
            continue
        }
        if (T === null || R === null || typeof T != "object" || typeof R != "object") {
            y[S] = R;
            continue
        }
        const q = ov(T, R, r + 1);
        y[S] = q, q === T && v++
    }
    return f === m && v === f ? n : y
}

function ns(n, i) {
    if (!i || Object.keys(n).length !== Object.keys(i).length) return !1;
    for (const r in n) if (n[r] !== i[r]) return !1;
    return !0
}

function Xp(n) {
    return Array.isArray(n) && n.length === Object.keys(n).length
}

function nf(n) {
    if (!Jp(n)) return !1;
    const i = n.constructor;
    if (i === void 0) return !0;
    const r = i.prototype;
    return !(!Jp(r) || !r.hasOwnProperty("isPrototypeOf") || Object.getPrototypeOf(n) !== Object.prototype)
}

function Jp(n) {
    return Object.prototype.toString.call(n) === "[object Object]"
}

function P0(n) {
    return new Promise(i => {
        hi.setTimeout(i, n)
    })
}

function af(n, i, r) {
    return typeof r.structuralSharing == "function" ? r.structuralSharing(n, i) : r.structuralSharing !== !1 ? ov(n, i) : i
}

function I0(n, i, r = 0) {
    const u = [...n, i];
    return r && u.length > r ? u.slice(1) : u
}

function W0(n, i, r = 0) {
    const u = [i, ...n];
    return r && u.length > r ? u.slice(0, -1) : u
}

var Sf = Symbol();

function cv(n, i) {
    return !n.queryFn && i?.initialPromise ? () => i.initialPromise : !n.queryFn || n.queryFn === Sf ? () => Promise.reject(new Error(`Missing queryFn: '${n.queryHash}'`)) : n.queryFn
}

function Ef(n, i) {
    return typeof n == "function" ? n(...i) : !!n
}

function e_(n, i, r) {
    let u = !1, o;
    return Object.defineProperty(n, "signal", {
        enumerable: !0,
        get: () => (o ??= i(), u || (u = !0, o.aborted ? r() : o.addEventListener("abort", r, {once: !0})), o)
    }), n
}

var Er = (() => {
    let n = () => X0;
    return {
        isServer() {
            return n()
        }, setIsServer(i) {
            n = i
        }
    }
})();

function lf() {
    let n, i;
    const r = new Promise((o, f) => {
        n = o, i = f
    });
    r.status = "pending", r.catch(() => {
    });

    function u(o) {
        Object.assign(r, o), delete r.resolve, delete r.reject
    }

    return r.resolve = o => {
        u({status: "fulfilled", value: o}), n(o)
    }, r.reject = o => {
        u({status: "rejected", reason: o}), i(o)
    }, r
}

var t_ = F0;

function n_() {
    let n = [], i = 0, r = m => {
        m()
    }, u = m => {
        m()
    }, o = t_;
    const f = m => {
        i ? n.push(m) : o(() => {
            r(m)
        })
    }, d = () => {
        const m = n;
        n = [], m.length && o(() => {
            u(() => {
                m.forEach(y => {
                    r(y)
                })
            })
        })
    };
    return {
        batch: m => {
            let y;
            i++;
            try {
                y = m()
            } finally {
                i--, i || d()
            }
            return y
        }, batchCalls: m => (...y) => {
            f(() => {
                m(...y)
            })
        }, schedule: f, setNotifyFunction: m => {
            r = m
        }, setBatchNotifyFunction: m => {
            u = m
        }, setScheduler: m => {
            o = m
        }
    }
}

var zt = n_(), a_ = class extends ml {
    #e = !0;
    #t;
    #n;

    constructor() {
        super(), this.#n = n => {
            if (typeof window < "u" && window.addEventListener) {
                const i = () => n(!0), r = () => n(!1);
                return window.addEventListener("online", i, !1), window.addEventListener("offline", r, !1), () => {
                    window.removeEventListener("online", i), window.removeEventListener("offline", r)
                }
            }
        }
    }

    onSubscribe() {
        this.#t || this.setEventListener(this.#n)
    }

    onUnsubscribe() {
        this.hasListeners() || (this.#t?.(), this.#t = void 0)
    }

    setEventListener(n) {
        this.#n = n, this.#t?.(), this.#t = n(this.setOnline.bind(this))
    }

    setOnline(n) {
        this.#e !== n && (this.#e = n, this.listeners.forEach(r => {
            r(n)
        }))
    }

    isOnline() {
        return this.#e
    }
}, as = new a_;

function i_(n) {
    return Math.min(1e3 * 2 ** n, 3e4)
}

function fv(n) {
    return (n ?? "online") === "online" ? as.isOnline() : !0
}

var rf = class extends Error {
    constructor(n) {
        super("CancelledError"), this.revert = n?.revert, this.silent = n?.silent
    }
};

function dv(n) {
    let i = !1, r = 0, u;
    const o = lf(), f = () => o.status !== "pending", d = V => {
            if (!f()) {
                const U = new rf(V);
                T(U), n.onCancel?.(U)
            }
        }, m = () => {
            i = !0
        }, y = () => {
            i = !1
        }, v = () => bf.isFocused() && (n.networkMode === "always" || as.isOnline()) && n.canRun(),
        b = () => fv(n.networkMode) && n.canRun(), S = V => {
            f() || (u?.(), o.resolve(V))
        }, T = V => {
            f() || (u?.(), o.reject(V))
        }, R = () => new Promise(V => {
            u = U => {
                (f() || v()) && V(U)
            }, n.onPause?.()
        }).then(() => {
            u = void 0, f() || n.onContinue?.()
        }), q = () => {
            if (f()) return;
            let V;
            const U = r === 0 ? n.initialPromise : void 0;
            try {
                V = U ?? n.fn()
            } catch (J) {
                V = Promise.reject(J)
            }
            Promise.resolve(V).then(S).catch(J => {
                if (f()) return;
                const G = n.retry ?? (Er.isServer() ? 0 : 3), W = n.retryDelay ?? i_,
                    Y = typeof W == "function" ? W(r, J) : W,
                    te = G === !0 || typeof G == "number" && r < G || typeof G == "function" && G(r, J);
                if (i || !te) {
                    T(J);
                    return
                }
                r++, n.onFail?.(r, J), P0(Y).then(() => v() ? void 0 : R()).then(() => {
                    i ? T(J) : q()
                })
            })
        };
    return {
        promise: o,
        status: () => o.status,
        cancel: d,
        continue: () => (u?.(), o),
        cancelRetry: m,
        continueRetry: y,
        canStart: b,
        start: () => (b() ? q() : R().then(q), o)
    }
}

var hv = class {
    #e;

    destroy() {
        this.clearGcTimeout()
    }

    scheduleGc() {
        this.clearGcTimeout(), tf(this.gcTime) && (this.#e = hi.setTimeout(() => {
            this.optionalRemove()
        }, this.gcTime))
    }

    updateGcTime(n) {
        this.gcTime = Math.max(this.gcTime || 0, n ?? (Er.isServer() ? 1 / 0 : 300 * 1e3))
    }

    clearGcTimeout() {
        this.#e !== void 0 && (hi.clearTimeout(this.#e), this.#e = void 0)
    }
};

function l_(n) {
    return {
        onFetch: (i, r) => {
            const u = i.options, o = i.fetchOptions?.meta?.fetchMore?.direction, f = i.state.data?.pages || [],
                d = i.state.data?.pageParams || [];
            let m = {pages: [], pageParams: []}, y = 0;
            const v = async () => {
                let b = !1;
                const S = q => {
                    e_(q, () => i.signal, () => b = !0)
                }, T = cv(i.options, i.fetchOptions), R = async (q, V, U) => {
                    if (b) return Promise.reject(i.signal.reason);
                    if (V == null && q.pages.length) return Promise.resolve(q);
                    const G = (() => {
                        const Te = {
                            client: i.client,
                            queryKey: i.queryKey,
                            pageParam: V,
                            direction: U ? "backward" : "forward",
                            meta: i.options.meta
                        };
                        return S(Te), Te
                    })(), W = await T(G), {maxPages: Y} = i.options, te = U ? W0 : I0;
                    return {pages: te(q.pages, W, Y), pageParams: te(q.pageParams, V, Y)}
                };
                if (o && f.length) {
                    const q = o === "backward", V = q ? r_ : Kp, U = {pages: f, pageParams: d}, J = V(u, U);
                    m = await R(U, J, q)
                } else {
                    const q = n ?? f.length;
                    do {
                        const V = y === 0 ? d[0] ?? u.initialPageParam : Kp(u, m);
                        if (y > 0 && V == null) break;
                        m = await R(m, V), y++
                    } while (y < q)
                }
                return m
            };
            i.options.persister ? i.fetchFn = () => i.options.persister?.(v, {
                client: i.client,
                queryKey: i.queryKey,
                meta: i.options.meta,
                signal: i.signal
            }, r) : i.fetchFn = v
        }
    }
}

function Kp(n, {pages: i, pageParams: r}) {
    const u = i.length - 1;
    return i.length > 0 ? n.getNextPageParam(i[u], i, r[u], r) : void 0
}

function r_(n, {pages: i, pageParams: r}) {
    return i.length > 0 ? n.getPreviousPageParam?.(i[0], i, r[0], r) : void 0
}

var u_ = class extends hv {
    #e;
    #t;
    #n;
    #a;
    #l;
    #i;
    #u;
    #r;

    constructor(n) {
        super(), this.#r = !1, this.#u = n.defaultOptions, this.setOptions(n.options), this.observers = [], this.#l = n.client, this.#a = this.#l.getQueryCache(), this.queryKey = n.queryKey, this.queryHash = n.queryHash, this.#t = Ip(this.options), this.state = n.state ?? this.#t, this.scheduleGc()
    }

    get meta() {
        return this.options.meta
    }

    get queryType() {
        return this.#e
    }

    get promise() {
        return this.#i?.promise
    }

    setOptions(n) {
        if (this.options = {...this.#u, ...n}, n?._type && (this.#e = n._type), this.updateGcTime(this.options.gcTime), this.state && this.state.data === void 0) {
            const i = Ip(this.options);
            i.data !== void 0 && (this.setState(Pp(i.data, i.dataUpdatedAt)), this.#t = i)
        }
    }

    optionalRemove() {
        !this.observers.length && this.state.fetchStatus === "idle" && this.#a.remove(this)
    }

    setData(n, i) {
        const r = af(this.state.data, n, this.options);
        return this.#s({data: r, type: "success", dataUpdatedAt: i?.updatedAt, manual: i?.manual}), r
    }

    setState(n) {
        this.#s({type: "setState", state: n})
    }

    cancel(n) {
        const i = this.#i?.promise;
        return this.#i?.cancel(n), i ? i.then(Ht).catch(Ht) : Promise.resolve()
    }

    destroy() {
        super.destroy(), this.cancel({silent: !0})
    }

    get resetState() {
        return this.#t
    }

    reset() {
        this.destroy(), this.setState(this.resetState)
    }

    isActive() {
        return this.observers.some(n => cn(n.options.enabled, this) !== !1)
    }

    isDisabled() {
        return this.getObserversCount() > 0 ? !this.isActive() : this.options.queryFn === Sf || !this.isFetched()
    }

    isFetched() {
        return this.state.dataUpdateCount + this.state.errorUpdateCount > 0
    }

    isStatic() {
        return this.getObserversCount() > 0 ? this.observers.some(n => $a(n.options.staleTime, this) === "static") : !1
    }

    isStale() {
        return this.getObserversCount() > 0 ? this.observers.some(n => n.getCurrentResult().isStale) : this.state.data === void 0 || this.state.isInvalidated
    }

    isStaleByTime(n = 0) {
        return this.state.data === void 0 ? !0 : n === "static" ? !1 : this.state.isInvalidated ? !0 : !sv(this.state.dataUpdatedAt, n)
    }

    onFocus() {
        this.observers.find(i => i.shouldFetchOnWindowFocus())?.refetch({cancelRefetch: !1}), this.#i?.continue()
    }

    onOnline() {
        this.observers.find(i => i.shouldFetchOnReconnect())?.refetch({cancelRefetch: !1}), this.#i?.continue()
    }

    addObserver(n) {
        this.observers.includes(n) || (this.observers.push(n), this.clearGcTimeout(), this.#a.notify({
            type: "observerAdded",
            query: this,
            observer: n
        }))
    }

    removeObserver(n) {
        this.observers.includes(n) && (this.observers = this.observers.filter(i => i !== n), this.observers.length || (this.#i && (this.#r || this.#c() ? this.#i.cancel({revert: !0}) : this.#i.cancelRetry()), this.scheduleGc()), this.#a.notify({
            type: "observerRemoved",
            query: this,
            observer: n
        }))
    }

    getObserversCount() {
        return this.observers.length
    }

    #c() {
        return this.state.fetchStatus === "paused" && this.state.status === "pending"
    }

    invalidate() {
        this.state.isInvalidated || this.#s({type: "invalidate"})
    }

    async fetch(n, i) {
        if (this.state.fetchStatus !== "idle" && this.#i?.status() !== "rejected") {
            if (this.state.data !== void 0 && i?.cancelRefetch) this.cancel({silent: !0}); else if (this.#i) return this.#i.continueRetry(), this.#i.promise
        }
        if (n && this.setOptions(n), !this.options.queryFn) {
            const y = this.observers.find(v => v.options.queryFn);
            y && this.setOptions(y.options)
        }
        const r = new AbortController, u = y => {
            Object.defineProperty(y, "signal", {enumerable: !0, get: () => (this.#r = !0, r.signal)})
        }, o = () => {
            const y = cv(this.options, i), b = (() => {
                const S = {client: this.#l, queryKey: this.queryKey, meta: this.meta};
                return u(S), S
            })();
            return this.#r = !1, this.options.persister ? this.options.persister(y, b, this) : y(b)
        }, d = (() => {
            const y = {
                fetchOptions: i,
                options: this.options,
                queryKey: this.queryKey,
                client: this.#l,
                state: this.state,
                fetchFn: o
            };
            return u(y), y
        })();
        (this.#e === "infinite" ? l_(this.options.pages) : this.options.behavior)?.onFetch(d, this), this.#n = this.state, (this.state.fetchStatus === "idle" || this.state.fetchMeta !== d.fetchOptions?.meta) && this.#s({
            type: "fetch",
            meta: d.fetchOptions?.meta
        }), this.#i = dv({
            initialPromise: i?.initialPromise,
            fn: d.fetchFn,
            onCancel: y => {
                y instanceof rf && y.revert && this.setState({...this.#n, fetchStatus: "idle"}), r.abort()
            },
            onFail: (y, v) => {
                this.#s({type: "failed", failureCount: y, error: v})
            },
            onPause: () => {
                this.#s({type: "pause"})
            },
            onContinue: () => {
                this.#s({type: "continue"})
            },
            retry: d.options.retry,
            retryDelay: d.options.retryDelay,
            networkMode: d.options.networkMode,
            canRun: () => !0
        });
        try {
            const y = await this.#i.start();
            if (y === void 0) throw new Error(`${this.queryHash} data is undefined`);
            return this.setData(y), this.#a.config.onSuccess?.(y, this), this.#a.config.onSettled?.(y, this.state.error, this), y
        } catch (y) {
            if (y instanceof rf) {
                if (y.silent) return this.#i.promise;
                if (y.revert) {
                    if (this.state.data === void 0) throw y;
                    return this.state.data
                }
            }
            throw this.#s({
                type: "error",
                error: y
            }), this.#a.config.onError?.(y, this), this.#a.config.onSettled?.(this.state.data, y, this), y
        } finally {
            this.scheduleGc()
        }
    }

    #s(n) {
        const i = r => {
            switch (n.type) {
                case"failed":
                    return {...r, fetchFailureCount: n.failureCount, fetchFailureReason: n.error};
                case"pause":
                    return {...r, fetchStatus: "paused"};
                case"continue":
                    return {...r, fetchStatus: "fetching"};
                case"fetch":
                    return {...r, ...mv(r.data, this.options), fetchMeta: n.meta ?? null};
                case"success":
                    const u = {
                        ...r, ...Pp(n.data, n.dataUpdatedAt),
                        dataUpdateCount: r.dataUpdateCount + 1, ...!n.manual && {
                            fetchStatus: "idle",
                            fetchFailureCount: 0,
                            fetchFailureReason: null
                        }
                    };
                    return this.#n = n.manual ? u : void 0, u;
                case"error":
                    const o = n.error;
                    return {
                        ...r,
                        error: o,
                        errorUpdateCount: r.errorUpdateCount + 1,
                        errorUpdatedAt: Date.now(),
                        fetchFailureCount: r.fetchFailureCount + 1,
                        fetchFailureReason: o,
                        fetchStatus: "idle",
                        status: "error",
                        isInvalidated: !0
                    };
                case"invalidate":
                    return {...r, isInvalidated: !0};
                case"setState":
                    return {...r, ...n.state}
            }
        };
        this.state = i(this.state), zt.batch(() => {
            this.observers.forEach(r => {
                r.onQueryUpdate()
            }), this.#a.notify({query: this, type: "updated", action: n})
        })
    }
};

function mv(n, i) {
    return {
        fetchFailureCount: 0,
        fetchFailureReason: null,
        fetchStatus: fv(i.networkMode) ? "fetching" : "paused", ...n === void 0 && {error: null, status: "pending"}
    }
}

function Pp(n, i) {
    return {data: n, dataUpdatedAt: i ?? Date.now(), error: null, isInvalidated: !1, status: "success"}
}

function Ip(n) {
    const i = typeof n.initialData == "function" ? n.initialData() : n.initialData, r = i !== void 0,
        u = r ? typeof n.initialDataUpdatedAt == "function" ? n.initialDataUpdatedAt() : n.initialDataUpdatedAt : 0;
    return {
        data: i,
        dataUpdateCount: 0,
        dataUpdatedAt: r ? u ?? Date.now() : 0,
        error: null,
        errorUpdateCount: 0,
        errorUpdatedAt: 0,
        fetchFailureCount: 0,
        fetchFailureReason: null,
        fetchMeta: null,
        isInvalidated: !1,
        status: r ? "success" : "pending",
        fetchStatus: "idle"
    }
}

var s_ = class extends ml {
    constructor(n, i) {
        super(), this.options = i, this.#e = n, this.#r = null, this.#u = lf(), this.bindMethods(), this.setOptions(i)
    }

    #e;
    #t = void 0;
    #n = void 0;
    #a = void 0;
    #l;
    #i;
    #u;
    #r;
    #c;
    #s;
    #m;
    #f;
    #d;
    #o;
    #p = new Set;

    bindMethods() {
        this.refetch = this.refetch.bind(this)
    }

    onSubscribe() {
        this.listeners.size === 1 && (this.#t.addObserver(this), Wp(this.#t, this.options) ? this.#h() : this.updateResult(), this.#b())
    }

    onUnsubscribe() {
        this.hasListeners() || this.destroy()
    }

    shouldFetchOnReconnect() {
        return uf(this.#t, this.options, this.options.refetchOnReconnect)
    }

    shouldFetchOnWindowFocus() {
        return uf(this.#t, this.options, this.options.refetchOnWindowFocus)
    }

    destroy() {
        this.listeners = new Set, this.#_(), this.#S(), this.#t.removeObserver(this)
    }

    setOptions(n) {
        const i = this.options, r = this.#t;
        if (this.options = this.#e.defaultQueryOptions(n), this.options.enabled !== void 0 && typeof this.options.enabled != "boolean" && typeof this.options.enabled != "function" && typeof cn(this.options.enabled, this.#t) != "boolean") throw new Error("Expected enabled to be a boolean or a callback that returns a boolean");
        this.#E(), this.#t.setOptions(this.options), i._defaulted && !ns(this.options, i) && this.#e.getQueryCache().notify({
            type: "observerOptionsUpdated",
            query: this.#t,
            observer: this
        });
        const u = this.hasListeners();
        u && ey(this.#t, r, this.options, i) && this.#h(), this.updateResult(), u && (this.#t !== r || cn(this.options.enabled, this.#t) !== cn(i.enabled, this.#t) || $a(this.options.staleTime, this.#t) !== $a(i.staleTime, this.#t)) && this.#y();
        const o = this.#v();
        u && (this.#t !== r || cn(this.options.enabled, this.#t) !== cn(i.enabled, this.#t) || o !== this.#o) && this.#g(o)
    }

    getOptimisticResult(n) {
        const i = this.#e.getQueryCache().build(this.#e, n), r = this.createResult(i, n);
        return c_(this, r) && (this.#a = r, this.#i = this.options, this.#l = this.#t.state), r
    }

    getCurrentResult() {
        return this.#a
    }

    trackResult(n, i) {
        return new Proxy(n, {get: (r, u) => (this.trackProp(u), i?.(u), u === "promise" && (this.trackProp("data"), !this.options.experimental_prefetchInRender && this.#u.status === "pending" && this.#u.reject(new Error("experimental_prefetchInRender feature flag is not enabled"))), Reflect.get(r, u))})
    }

    trackProp(n) {
        this.#p.add(n)
    }

    getCurrentQuery() {
        return this.#t
    }

    refetch({...n} = {}) {
        return this.fetch({...n})
    }

    fetchOptimistic(n) {
        const i = this.#e.defaultQueryOptions(n), r = this.#e.getQueryCache().build(this.#e, i);
        return r.fetch().then(() => this.createResult(r, i))
    }

    fetch(n) {
        return this.#h({...n, cancelRefetch: n.cancelRefetch ?? !0}).then(() => (this.updateResult(), this.#a))
    }

    #h(n) {
        this.#E();
        let i = this.#t.fetch(this.options, n);
        return n?.throwOnError || (i = i.catch(Ht)), i
    }

    #y() {
        this.#_();
        const n = $a(this.options.staleTime, this.#t);
        if (Er.isServer() || this.#a.isStale || !tf(n)) return;
        const r = sv(this.#a.dataUpdatedAt, n) + 1;
        this.#f = hi.setTimeout(() => {
            this.#a.isStale || this.updateResult()
        }, r)
    }

    #v() {
        return (typeof this.options.refetchInterval == "function" ? this.options.refetchInterval(this.#t) : this.options.refetchInterval) ?? !1
    }

    #g(n) {
        this.#S(), this.#o = n, !(Er.isServer() || cn(this.options.enabled, this.#t) === !1 || !tf(this.#o) || this.#o === 0) && (this.#d = hi.setInterval(() => {
            (this.options.refetchIntervalInBackground || bf.isFocused()) && this.#h()
        }, this.#o))
    }

    #b() {
        this.#y(), this.#g(this.#v())
    }

    #_() {
        this.#f !== void 0 && (hi.clearTimeout(this.#f), this.#f = void 0)
    }

    #S() {
        this.#d !== void 0 && (hi.clearInterval(this.#d), this.#d = void 0)
    }

    createResult(n, i) {
        const r = this.#t, u = this.options, o = this.#a, f = this.#l, d = this.#i,
            y = n !== r ? n.state : this.#n, {state: v} = n;
        let b = {...v}, S = !1, T;
        if (i._optimisticResults) {
            const be = this.hasListeners(), qe = !be && Wp(n, i), Le = be && ey(n, r, i, u);
            (qe || Le) && (b = {...b, ...mv(v.data, n.options)}), i._optimisticResults === "isRestoring" && (b.fetchStatus = "idle")
        }
        let {error: R, errorUpdatedAt: q, status: V} = b;
        T = b.data;
        let U = !1;
        if (i.placeholderData !== void 0 && T === void 0 && V === "pending") {
            let be;
            o?.isPlaceholderData && i.placeholderData === d?.placeholderData ? (be = o.data, U = !0) : be = typeof i.placeholderData == "function" ? i.placeholderData(this.#m?.state.data, this.#m) : i.placeholderData, be !== void 0 && (V = "success", T = af(o?.data, be, i), S = !0)
        }
        if (i.select && T !== void 0 && !U) if (o && T === f?.data && i.select === this.#c) T = this.#s; else try {
            this.#c = i.select, T = i.select(T), T = af(o?.data, T, i), this.#s = T, this.#r = null
        } catch (be) {
            this.#r = be
        }
        this.#r && (R = this.#r, T = this.#s, q = Date.now(), V = "error");
        const J = b.fetchStatus === "fetching", G = V === "pending", W = V === "error", Y = G && J, te = T !== void 0,
            le = {
                status: V,
                fetchStatus: b.fetchStatus,
                isPending: G,
                isSuccess: V === "success",
                isError: W,
                isInitialLoading: Y,
                isLoading: Y,
                data: T,
                dataUpdatedAt: b.dataUpdatedAt,
                error: R,
                errorUpdatedAt: q,
                failureCount: b.fetchFailureCount,
                failureReason: b.fetchFailureReason,
                errorUpdateCount: b.errorUpdateCount,
                isFetched: n.isFetched(),
                isFetchedAfterMount: b.dataUpdateCount > y.dataUpdateCount || b.errorUpdateCount > y.errorUpdateCount,
                isFetching: J,
                isRefetching: J && !G,
                isLoadingError: W && !te,
                isPaused: b.fetchStatus === "paused",
                isPlaceholderData: S,
                isRefetchError: W && te,
                isStale: xf(n, i),
                refetch: this.refetch,
                promise: this.#u,
                isEnabled: cn(i.enabled, n) !== !1
            };
        if (this.options.experimental_prefetchInRender) {
            const be = le.data !== void 0, qe = le.status === "error" && !be, Le = de => {
                qe ? de.reject(le.error) : be && de.resolve(le.data)
            }, Ie = () => {
                const de = this.#u = le.promise = lf();
                Le(de)
            }, fe = this.#u;
            switch (fe.status) {
                case"pending":
                    n.queryHash === r.queryHash && Le(fe);
                    break;
                case"fulfilled":
                    (qe || le.data !== fe.value) && Ie();
                    break;
                case"rejected":
                    (!qe || le.error !== fe.reason) && Ie();
                    break
            }
        }
        return le
    }

    updateResult() {
        const n = this.#a, i = this.createResult(this.#t, this.options);
        if (this.#l = this.#t.state, this.#i = this.options, this.#l.data !== void 0 && (this.#m = this.#t), ns(i, n)) return;
        this.#a = i;
        const r = () => {
            if (!n) return !0;
            const {notifyOnChangeProps: u} = this.options, o = typeof u == "function" ? u() : u;
            if (o === "all" || !o && !this.#p.size) return !0;
            const f = new Set(o ?? this.#p);
            return this.options.throwOnError && f.add("error"), Object.keys(this.#a).some(d => {
                const m = d;
                return this.#a[m] !== n[m] && f.has(m)
            })
        };
        this.#x({listeners: r()})
    }

    #E() {
        const n = this.#e.getQueryCache().build(this.#e, this.options);
        if (n === this.#t) return;
        const i = this.#t;
        this.#t = n, this.#n = n.state, this.hasListeners() && (i?.removeObserver(this), n.addObserver(this))
    }

    onQueryUpdate() {
        this.updateResult(), this.hasListeners() && this.#b()
    }

    #x(n) {
        zt.batch(() => {
            n.listeners && this.listeners.forEach(i => {
                i(this.#a)
            }), this.#e.getQueryCache().notify({query: this.#t, type: "observerResultsUpdated"})
        })
    }
};

function o_(n, i) {
    return cn(i.enabled, n) !== !1 && n.state.data === void 0 && !(n.state.status === "error" && cn(i.retryOnMount, n) === !1)
}

function Wp(n, i) {
    return o_(n, i) || n.state.data !== void 0 && uf(n, i, i.refetchOnMount)
}

function uf(n, i, r) {
    if (cn(i.enabled, n) !== !1 && $a(i.staleTime, n) !== "static") {
        const u = typeof r == "function" ? r(n) : r;
        return u === "always" || u !== !1 && xf(n, i)
    }
    return !1
}

function ey(n, i, r, u) {
    return (n !== i || cn(u.enabled, n) === !1) && (!r.suspense || n.state.status !== "error") && xf(n, r)
}

function xf(n, i) {
    return cn(i.enabled, n) !== !1 && n.isStaleByTime($a(i.staleTime, n))
}

function c_(n, i) {
    return !ns(n.getCurrentResult(), i)
}

var f_ = class extends hv {
    #e;
    #t;
    #n;
    #a;

    constructor(n) {
        super(), this.#e = n.client, this.mutationId = n.mutationId, this.#n = n.mutationCache, this.#t = [], this.state = n.state || pv(), this.setOptions(n.options), this.scheduleGc()
    }

    setOptions(n) {
        this.options = n, this.updateGcTime(this.options.gcTime)
    }

    get meta() {
        return this.options.meta
    }

    addObserver(n) {
        this.#t.includes(n) || (this.#t.push(n), this.clearGcTimeout(), this.#n.notify({
            type: "observerAdded",
            mutation: this,
            observer: n
        }))
    }

    removeObserver(n) {
        this.#t = this.#t.filter(i => i !== n), this.scheduleGc(), this.#n.notify({
            type: "observerRemoved",
            mutation: this,
            observer: n
        })
    }

    optionalRemove() {
        this.#t.length || (this.state.status === "pending" ? this.scheduleGc() : this.#n.remove(this))
    }

    continue() {
        return this.#a?.continue() ?? this.execute(this.state.variables)
    }

    async execute(n) {
        const i = () => {
            this.#l({type: "continue"})
        }, r = {client: this.#e, meta: this.options.meta, mutationKey: this.options.mutationKey};
        this.#a = dv({
            fn: () => this.options.mutationFn ? this.options.mutationFn(n, r) : Promise.reject(new Error("No mutationFn found")),
            onFail: (f, d) => {
                this.#l({type: "failed", failureCount: f, error: d})
            },
            onPause: () => {
                this.#l({type: "pause"})
            },
            onContinue: i,
            retry: this.options.retry ?? 0,
            retryDelay: this.options.retryDelay,
            networkMode: this.options.networkMode,
            canRun: () => this.#n.canRun(this)
        });
        const u = this.state.status === "pending", o = !this.#a.canStart();
        try {
            if (u) i(); else {
                this.#l({
                    type: "pending",
                    variables: n,
                    isPaused: o
                }), this.#n.config.onMutate && await this.#n.config.onMutate(n, this, r);
                const d = await this.options.onMutate?.(n, r);
                d !== this.state.context && this.#l({type: "pending", context: d, variables: n, isPaused: o})
            }
            const f = await this.#a.start();
            return await this.#n.config.onSuccess?.(f, n, this.state.context, this, r), await this.options.onSuccess?.(f, n, this.state.context, r), await this.#n.config.onSettled?.(f, null, this.state.variables, this.state.context, this, r), await this.options.onSettled?.(f, null, n, this.state.context, r), this.#l({
                type: "success",
                data: f
            }), f
        } catch (f) {
            try {
                await this.#n.config.onError?.(f, n, this.state.context, this, r)
            } catch (d) {
                Promise.reject(d)
            }
            try {
                await this.options.onError?.(f, n, this.state.context, r)
            } catch (d) {
                Promise.reject(d)
            }
            try {
                await this.#n.config.onSettled?.(void 0, f, this.state.variables, this.state.context, this, r)
            } catch (d) {
                Promise.reject(d)
            }
            try {
                await this.options.onSettled?.(void 0, f, n, this.state.context, r)
            } catch (d) {
                Promise.reject(d)
            }
            throw this.#l({type: "error", error: f}), f
        } finally {
            this.#n.runNext(this)
        }
    }

    #l(n) {
        const i = r => {
            switch (n.type) {
                case"failed":
                    return {...r, failureCount: n.failureCount, failureReason: n.error};
                case"pause":
                    return {...r, isPaused: !0};
                case"continue":
                    return {...r, isPaused: !1};
                case"pending":
                    return {
                        ...r,
                        context: n.context,
                        data: void 0,
                        failureCount: 0,
                        failureReason: null,
                        error: null,
                        isPaused: n.isPaused,
                        status: "pending",
                        variables: n.variables,
                        submittedAt: Date.now()
                    };
                case"success":
                    return {
                        ...r,
                        data: n.data,
                        failureCount: 0,
                        failureReason: null,
                        error: null,
                        status: "success",
                        isPaused: !1
                    };
                case"error":
                    return {
                        ...r,
                        data: void 0,
                        error: n.error,
                        failureCount: r.failureCount + 1,
                        failureReason: n.error,
                        isPaused: !1,
                        status: "error"
                    }
            }
        };
        this.state = i(this.state), zt.batch(() => {
            this.#t.forEach(r => {
                r.onMutationUpdate(n)
            }), this.#n.notify({mutation: this, type: "updated", action: n})
        })
    }
};

function pv() {
    return {
        context: void 0,
        data: void 0,
        error: null,
        failureCount: 0,
        failureReason: null,
        isPaused: !1,
        status: "idle",
        variables: void 0,
        submittedAt: 0
    }
}

var d_ = class extends ml {
    constructor(n = {}) {
        super(), this.config = n, this.#e = new Set, this.#t = new Map, this.#n = 0
    }

    #e;
    #t;
    #n;

    build(n, i, r) {
        const u = new f_({
            client: n,
            mutationCache: this,
            mutationId: ++this.#n,
            options: n.defaultMutationOptions(i),
            state: r
        });
        return this.add(u), u
    }

    add(n) {
        this.#e.add(n);
        const i = Fu(n);
        if (typeof i == "string") {
            const r = this.#t.get(i);
            r ? r.push(n) : this.#t.set(i, [n])
        }
        this.notify({type: "added", mutation: n})
    }

    remove(n) {
        if (this.#e.delete(n)) {
            const i = Fu(n);
            if (typeof i == "string") {
                const r = this.#t.get(i);
                if (r) if (r.length > 1) {
                    const u = r.indexOf(n);
                    u !== -1 && r.splice(u, 1)
                } else r[0] === n && this.#t.delete(i)
            }
        }
        this.notify({type: "removed", mutation: n})
    }

    canRun(n) {
        const i = Fu(n);
        if (typeof i == "string") {
            const u = this.#t.get(i)?.find(o => o.state.status === "pending");
            return !u || u === n
        } else return !0
    }

    runNext(n) {
        const i = Fu(n);
        return typeof i == "string" ? this.#t.get(i)?.find(u => u !== n && u.state.isPaused)?.continue() ?? Promise.resolve() : Promise.resolve()
    }

    clear() {
        zt.batch(() => {
            this.#e.forEach(n => {
                this.notify({type: "removed", mutation: n})
            }), this.#e.clear(), this.#t.clear()
        })
    }

    getAll() {
        return Array.from(this.#e)
    }

    find(n) {
        const i = {exact: !0, ...n};
        return this.getAll().find(r => Fp(i, r))
    }

    findAll(n = {}) {
        return this.getAll().filter(i => Fp(n, i))
    }

    notify(n) {
        zt.batch(() => {
            this.listeners.forEach(i => {
                i(n)
            })
        })
    }

    resumePausedMutations() {
        const n = this.getAll().filter(i => i.state.isPaused);
        return zt.batch(() => Promise.all(n.map(i => i.continue().catch(Ht))))
    }
};

function Fu(n) {
    return n.options.scope?.id
}

var h_ = class extends ml {
    #e;
    #t = void 0;
    #n;
    #a;

    constructor(i, r) {
        super(), this.#e = i, this.setOptions(r), this.bindMethods(), this.#l()
    }

    bindMethods() {
        this.mutate = this.mutate.bind(this), this.reset = this.reset.bind(this)
    }

    setOptions(i) {
        const r = this.options;
        this.options = this.#e.defaultMutationOptions(i), ns(this.options, r) || this.#e.getMutationCache().notify({
            type: "observerOptionsUpdated",
            mutation: this.#n,
            observer: this
        }), r?.mutationKey && this.options.mutationKey && yi(r.mutationKey) !== yi(this.options.mutationKey) ? this.reset() : this.#n?.state.status === "pending" && this.#n.setOptions(this.options)
    }

    onUnsubscribe() {
        this.hasListeners() || this.#n?.removeObserver(this)
    }

    onMutationUpdate(i) {
        this.#l(), this.#i(i)
    }

    getCurrentResult() {
        return this.#t
    }

    reset() {
        this.#n?.removeObserver(this), this.#n = void 0, this.#l(), this.#i()
    }

    mutate(i, r) {
        return this.#a = r, this.#n?.removeObserver(this), this.#n = this.#e.getMutationCache().build(this.#e, this.options), this.#n.addObserver(this), this.#n.execute(i)
    }

    #l() {
        const i = this.#n?.state ?? pv();
        this.#t = {
            ...i,
            isPending: i.status === "pending",
            isSuccess: i.status === "success",
            isError: i.status === "error",
            isIdle: i.status === "idle",
            mutate: this.mutate,
            reset: this.reset
        }
    }

    #i(i) {
        zt.batch(() => {
            if (this.#a && this.hasListeners()) {
                const r = this.#t.variables, u = this.#t.context,
                    o = {client: this.#e, meta: this.options.meta, mutationKey: this.options.mutationKey};
                if (i?.type === "success") {
                    try {
                        this.#a.onSuccess?.(i.data, r, u, o)
                    } catch (f) {
                        Promise.reject(f)
                    }
                    try {
                        this.#a.onSettled?.(i.data, null, r, u, o)
                    } catch (f) {
                        Promise.reject(f)
                    }
                } else if (i?.type === "error") {
                    try {
                        this.#a.onError?.(i.error, r, u, o)
                    } catch (f) {
                        Promise.reject(f)
                    }
                    try {
                        this.#a.onSettled?.(void 0, i.error, r, u, o)
                    } catch (f) {
                        Promise.reject(f)
                    }
                }
            }
            this.listeners.forEach(r => {
                r(this.#t)
            })
        })
    }
}, m_ = class extends ml {
    constructor(n = {}) {
        super(), this.config = n, this.#e = new Map
    }

    #e;

    build(n, i, r) {
        const u = i.queryKey, o = i.queryHash ?? _f(u, i);
        let f = this.get(o);
        return f || (f = new u_({
            client: n,
            queryKey: u,
            queryHash: o,
            options: n.defaultQueryOptions(i),
            state: r,
            defaultOptions: n.getQueryDefaults(u)
        }), this.add(f)), f
    }

    add(n) {
        this.#e.has(n.queryHash) || (this.#e.set(n.queryHash, n), this.notify({type: "added", query: n}))
    }

    remove(n) {
        const i = this.#e.get(n.queryHash);
        i && (n.destroy(), i === n && this.#e.delete(n.queryHash), this.notify({type: "removed", query: n}))
    }

    clear() {
        zt.batch(() => {
            this.getAll().forEach(n => {
                this.remove(n)
            })
        })
    }

    get(n) {
        return this.#e.get(n)
    }

    getAll() {
        return [...this.#e.values()]
    }

    find(n) {
        const i = {exact: !0, ...n};
        return this.getAll().find(r => Gp(i, r))
    }

    findAll(n = {}) {
        const i = this.getAll();
        return Object.keys(n).length > 0 ? i.filter(r => Gp(n, r)) : i
    }

    notify(n) {
        zt.batch(() => {
            this.listeners.forEach(i => {
                i(n)
            })
        })
    }

    onFocus() {
        zt.batch(() => {
            this.getAll().forEach(n => {
                n.onFocus()
            })
        })
    }

    onOnline() {
        zt.batch(() => {
            this.getAll().forEach(n => {
                n.onOnline()
            })
        })
    }
}, p_ = class {
    #e;
    #t;
    #n;
    #a;
    #l;
    #i;
    #u;
    #r;

    constructor(n = {}) {
        this.#e = n.queryCache || new m_, this.#t = n.mutationCache || new d_, this.#n = n.defaultOptions || {}, this.#a = new Map, this.#l = new Map, this.#i = 0
    }

    mount() {
        this.#i++, this.#i === 1 && (this.#u = bf.subscribe(async n => {
            n && (await this.resumePausedMutations(), this.#e.onFocus())
        }), this.#r = as.subscribe(async n => {
            n && (await this.resumePausedMutations(), this.#e.onOnline())
        }))
    }

    unmount() {
        this.#i--, this.#i === 0 && (this.#u?.(), this.#u = void 0, this.#r?.(), this.#r = void 0)
    }

    isFetching(n) {
        return this.#e.findAll({...n, fetchStatus: "fetching"}).length
    }

    isMutating(n) {
        return this.#t.findAll({...n, status: "pending"}).length
    }

    getQueryData(n) {
        const i = this.defaultQueryOptions({queryKey: n});
        return this.#e.get(i.queryHash)?.state.data
    }

    ensureQueryData(n) {
        const i = this.defaultQueryOptions(n), r = this.#e.build(this, i), u = r.state.data;
        return u === void 0 ? this.fetchQuery(n) : (n.revalidateIfStale && r.isStaleByTime($a(i.staleTime, r)) && this.prefetchQuery(i), Promise.resolve(u))
    }

    getQueriesData(n) {
        return this.#e.findAll(n).map(({queryKey: i, state: r}) => {
            const u = r.data;
            return [i, u]
        })
    }

    setQueryData(n, i, r) {
        const u = this.defaultQueryOptions({queryKey: n}), f = this.#e.get(u.queryHash)?.state.data, d = J0(i, f);
        if (d !== void 0) return this.#e.build(this, u).setData(d, {...r, manual: !0})
    }

    setQueriesData(n, i, r) {
        return zt.batch(() => this.#e.findAll(n).map(({queryKey: u}) => [u, this.setQueryData(u, i, r)]))
    }

    getQueryState(n) {
        const i = this.defaultQueryOptions({queryKey: n});
        return this.#e.get(i.queryHash)?.state
    }

    removeQueries(n) {
        const i = this.#e;
        zt.batch(() => {
            i.findAll(n).forEach(r => {
                i.remove(r)
            })
        })
    }

    resetQueries(n, i) {
        const r = this.#e;
        return zt.batch(() => (r.findAll(n).forEach(u => {
            u.reset()
        }), this.refetchQueries({type: "active", ...n}, i)))
    }

    cancelQueries(n, i = {}) {
        const r = {revert: !0, ...i}, u = zt.batch(() => this.#e.findAll(n).map(o => o.cancel(r)));
        return Promise.all(u).then(Ht).catch(Ht)
    }

    invalidateQueries(n, i = {}) {
        return zt.batch(() => (this.#e.findAll(n).forEach(r => {
            r.invalidate()
        }), n?.refetchType === "none" ? Promise.resolve() : this.refetchQueries({
            ...n,
            type: n?.refetchType ?? n?.type ?? "active"
        }, i)))
    }

    refetchQueries(n, i = {}) {
        const r = {...i, cancelRefetch: i.cancelRefetch ?? !0},
            u = zt.batch(() => this.#e.findAll(n).filter(o => !o.isDisabled() && !o.isStatic()).map(o => {
                let f = o.fetch(void 0, r);
                return r.throwOnError || (f = f.catch(Ht)), o.state.fetchStatus === "paused" ? Promise.resolve() : f
            }));
        return Promise.all(u).then(Ht)
    }

    fetchQuery(n) {
        const i = this.defaultQueryOptions(n);
        i.retry === void 0 && (i.retry = !1);
        const r = this.#e.build(this, i);
        return r.isStaleByTime($a(i.staleTime, r)) ? r.fetch(i) : Promise.resolve(r.state.data)
    }

    prefetchQuery(n) {
        return this.fetchQuery(n).then(Ht).catch(Ht)
    }

    fetchInfiniteQuery(n) {
        return n._type = "infinite", this.fetchQuery(n)
    }

    prefetchInfiniteQuery(n) {
        return this.fetchInfiniteQuery(n).then(Ht).catch(Ht)
    }

    ensureInfiniteQueryData(n) {
        return n._type = "infinite", this.ensureQueryData(n)
    }

    resumePausedMutations() {
        return as.isOnline() ? this.#t.resumePausedMutations() : Promise.resolve()
    }

    getQueryCache() {
        return this.#e
    }

    getMutationCache() {
        return this.#t
    }

    getDefaultOptions() {
        return this.#n
    }

    setDefaultOptions(n) {
        this.#n = n
    }

    setQueryDefaults(n, i) {
        this.#a.set(yi(n), {queryKey: n, defaultOptions: i})
    }

    getQueryDefaults(n) {
        const i = [...this.#a.values()], r = {};
        return i.forEach(u => {
            Sr(n, u.queryKey) && Object.assign(r, u.defaultOptions)
        }), r
    }

    setMutationDefaults(n, i) {
        this.#l.set(yi(n), {mutationKey: n, defaultOptions: i})
    }

    getMutationDefaults(n) {
        const i = [...this.#l.values()], r = {};
        return i.forEach(u => {
            Sr(n, u.mutationKey) && Object.assign(r, u.defaultOptions)
        }), r
    }

    defaultQueryOptions(n) {
        if (n._defaulted) return n;
        const i = {...this.#n.queries, ...this.getQueryDefaults(n.queryKey), ...n, _defaulted: !0};
        return i.queryHash || (i.queryHash = _f(i.queryKey, i)), i.refetchOnReconnect === void 0 && (i.refetchOnReconnect = i.networkMode !== "always"), i.throwOnError === void 0 && (i.throwOnError = !!i.suspense), !i.networkMode && i.persister && (i.networkMode = "offlineFirst"), i.queryFn === Sf && (i.enabled = !1), i
    }

    defaultMutationOptions(n) {
        return n?._defaulted ? n : {
            ...this.#n.mutations, ...n?.mutationKey && this.getMutationDefaults(n.mutationKey), ...n,
            _defaulted: !0
        }
    }

    clear() {
        this.#e.clear(), this.#t.clear()
    }
}, Vc = {exports: {}}, Ee = {};
var ty;

function y_() {
    if (ty) return Ee;
    ty = 1;
    var n = Symbol.for("react.transitional.element"), i = Symbol.for("react.portal"), r = Symbol.for("react.fragment"),
        u = Symbol.for("react.strict_mode"), o = Symbol.for("react.profiler"), f = Symbol.for("react.consumer"),
        d = Symbol.for("react.context"), m = Symbol.for("react.forward_ref"), y = Symbol.for("react.suspense"),
        v = Symbol.for("react.memo"), b = Symbol.for("react.lazy"), S = Symbol.for("react.activity"),
        T = Symbol.iterator;

    function R(x) {
        return x === null || typeof x != "object" ? null : (x = T && x[T] || x["@@iterator"], typeof x == "function" ? x : null)
    }

    var q = {
        isMounted: function () {
            return !1
        }, enqueueForceUpdate: function () {
        }, enqueueReplaceState: function () {
        }, enqueueSetState: function () {
        }
    }, V = Object.assign, U = {};

    function J(x, k, I) {
        this.props = x, this.context = k, this.refs = U, this.updater = I || q
    }

    J.prototype.isReactComponent = {}, J.prototype.setState = function (x, k) {
        if (typeof x != "object" && typeof x != "function" && x != null) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
        this.updater.enqueueSetState(this, x, k, "setState")
    }, J.prototype.forceUpdate = function (x) {
        this.updater.enqueueForceUpdate(this, x, "forceUpdate")
    };

    function G() {
    }

    G.prototype = J.prototype;

    function W(x, k, I) {
        this.props = x, this.context = k, this.refs = U, this.updater = I || q
    }

    var Y = W.prototype = new G;
    Y.constructor = W, V(Y, J.prototype), Y.isPureReactComponent = !0;
    var te = Array.isArray;

    function Te() {
    }

    var le = {H: null, A: null, T: null, S: null}, be = Object.prototype.hasOwnProperty;

    function qe(x, k, I) {
        var F = I.ref;
        return {$$typeof: n, type: x, key: k, ref: F !== void 0 ? F : null, props: I}
    }

    function Le(x, k) {
        return qe(x.type, k, x.props)
    }

    function Ie(x) {
        return typeof x == "object" && x !== null && x.$$typeof === n
    }

    function fe(x) {
        var k = {"=": "=0", ":": "=2"};
        return "$" + x.replace(/[=:]/g, function (I) {
            return k[I]
        })
    }

    var de = /\/+/g;

    function je(x, k) {
        return typeof x == "object" && x !== null && x.key != null ? fe("" + x.key) : k.toString(36)
    }

    function ge(x) {
        switch (x.status) {
            case"fulfilled":
                return x.value;
            case"rejected":
                throw x.reason;
            default:
                switch (typeof x.status == "string" ? x.then(Te, Te) : (x.status = "pending", x.then(function (k) {
                    x.status === "pending" && (x.status = "fulfilled", x.value = k)
                }, function (k) {
                    x.status === "pending" && (x.status = "rejected", x.reason = k)
                })), x.status) {
                    case"fulfilled":
                        return x.value;
                    case"rejected":
                        throw x.reason
                }
        }
        throw x
    }

    function Z(x, k, I, F, ye) {
        var _e = typeof x;
        (_e === "undefined" || _e === "boolean") && (x = null);
        var Re = !1;
        if (x === null) Re = !0; else switch (_e) {
            case"bigint":
            case"string":
            case"number":
                Re = !0;
                break;
            case"object":
                switch (x.$$typeof) {
                    case n:
                    case i:
                        Re = !0;
                        break;
                    case b:
                        return Re = x._init, Z(Re(x._payload), k, I, F, ye)
                }
        }
        if (Re) return ye = ye(x), Re = F === "" ? "." + je(x, 0) : F, te(ye) ? (I = "", Re != null && (I = Re.replace(de, "$&/") + "/"), Z(ye, k, I, "", function (dn) {
            return dn
        })) : ye != null && (Ie(ye) && (ye = Le(ye, I + (ye.key == null || x && x.key === ye.key ? "" : ("" + ye.key).replace(de, "$&/") + "/") + Re)), k.push(ye)), 1;
        Re = 0;
        var lt = F === "" ? "." : F + ":";
        if (te(x)) for (var He = 0; He < x.length; He++) F = x[He], _e = lt + je(F, He), Re += Z(F, k, I, _e, ye); else if (He = R(x), typeof He == "function") for (x = He.call(x), He = 0; !(F = x.next()).done;) F = F.value, _e = lt + je(F, He++), Re += Z(F, k, I, _e, ye); else if (_e === "object") {
            if (typeof x.then == "function") return Z(ge(x), k, I, F, ye);
            throw k = String(x), Error("Objects are not valid as a React child (found: " + (k === "[object Object]" ? "object with keys {" + Object.keys(x).join(", ") + "}" : k) + "). If you meant to render a collection of children, use an array instead.")
        }
        return Re
    }

    function K(x, k, I) {
        if (x == null) return x;
        var F = [], ye = 0;
        return Z(x, F, "", "", function (_e) {
            return k.call(I, _e, ye++)
        }), F
    }

    function ue(x) {
        if (x._status === -1) {
            var k = x._result;
            k = k(), k.then(function (I) {
                (x._status === 0 || x._status === -1) && (x._status = 1, x._result = I)
            }, function (I) {
                (x._status === 0 || x._status === -1) && (x._status = 2, x._result = I)
            }), x._status === -1 && (x._status = 0, x._result = k)
        }
        if (x._status === 1) return x._result.default;
        throw x._result
    }

    var xe = typeof reportError == "function" ? reportError : function (x) {
        if (typeof window == "object" && typeof window.ErrorEvent == "function") {
            var k = new window.ErrorEvent("error", {
                bubbles: !0,
                cancelable: !0,
                message: typeof x == "object" && x !== null && typeof x.message == "string" ? String(x.message) : String(x),
                error: x
            });
            if (!window.dispatchEvent(k)) return
        } else if (typeof process == "object" && typeof process.emit == "function") {
            process.emit("uncaughtException", x);
            return
        }
        console.error(x)
    }, Ae = {
        map: K, forEach: function (x, k, I) {
            K(x, function () {
                k.apply(this, arguments)
            }, I)
        }, count: function (x) {
            var k = 0;
            return K(x, function () {
                k++
            }), k
        }, toArray: function (x) {
            return K(x, function (k) {
                return k
            }) || []
        }, only: function (x) {
            if (!Ie(x)) throw Error("React.Children.only expected to receive a single React element child.");
            return x
        }
    };
    return Ee.Activity = S, Ee.Children = Ae, Ee.Component = J, Ee.Fragment = r, Ee.Profiler = o, Ee.PureComponent = W, Ee.StrictMode = u, Ee.Suspense = y, Ee.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = le, Ee.__COMPILER_RUNTIME = {
        __proto__: null,
        c: function (x) {
            return le.H.useMemoCache(x)
        }
    }, Ee.cache = function (x) {
        return function () {
            return x.apply(null, arguments)
        }
    }, Ee.cacheSignal = function () {
        return null
    }, Ee.cloneElement = function (x, k, I) {
        if (x == null) throw Error("The argument must be a React element, but you passed " + x + ".");
        var F = V({}, x.props), ye = x.key;
        if (k != null) for (_e in k.key !== void 0 && (ye = "" + k.key), k) !be.call(k, _e) || _e === "key" || _e === "__self" || _e === "__source" || _e === "ref" && k.ref === void 0 || (F[_e] = k[_e]);
        var _e = arguments.length - 2;
        if (_e === 1) F.children = I; else if (1 < _e) {
            for (var Re = Array(_e), lt = 0; lt < _e; lt++) Re[lt] = arguments[lt + 2];
            F.children = Re
        }
        return qe(x.type, ye, F)
    }, Ee.createContext = function (x) {
        return x = {
            $$typeof: d,
            _currentValue: x,
            _currentValue2: x,
            _threadCount: 0,
            Provider: null,
            Consumer: null
        }, x.Provider = x, x.Consumer = {$$typeof: f, _context: x}, x
    }, Ee.createElement = function (x, k, I) {
        var F, ye = {}, _e = null;
        if (k != null) for (F in k.key !== void 0 && (_e = "" + k.key), k) be.call(k, F) && F !== "key" && F !== "__self" && F !== "__source" && (ye[F] = k[F]);
        var Re = arguments.length - 2;
        if (Re === 1) ye.children = I; else if (1 < Re) {
            for (var lt = Array(Re), He = 0; He < Re; He++) lt[He] = arguments[He + 2];
            ye.children = lt
        }
        if (x && x.defaultProps) for (F in Re = x.defaultProps, Re) ye[F] === void 0 && (ye[F] = Re[F]);
        return qe(x, _e, ye)
    }, Ee.createRef = function () {
        return {current: null}
    }, Ee.forwardRef = function (x) {
        return {$$typeof: m, render: x}
    }, Ee.isValidElement = Ie, Ee.lazy = function (x) {
        return {$$typeof: b, _payload: {_status: -1, _result: x}, _init: ue}
    }, Ee.memo = function (x, k) {
        return {$$typeof: v, type: x, compare: k === void 0 ? null : k}
    }, Ee.startTransition = function (x) {
        var k = le.T, I = {};
        le.T = I;
        try {
            var F = x(), ye = le.S;
            ye !== null && ye(I, F), typeof F == "object" && F !== null && typeof F.then == "function" && F.then(Te, xe)
        } catch (_e) {
            xe(_e)
        } finally {
            k !== null && I.types !== null && (k.types = I.types), le.T = k
        }
    }, Ee.unstable_useCacheRefresh = function () {
        return le.H.useCacheRefresh()
    }, Ee.use = function (x) {
        return le.H.use(x)
    }, Ee.useActionState = function (x, k, I) {
        return le.H.useActionState(x, k, I)
    }, Ee.useCallback = function (x, k) {
        return le.H.useCallback(x, k)
    }, Ee.useContext = function (x) {
        return le.H.useContext(x)
    }, Ee.useDebugValue = function () {
    }, Ee.useDeferredValue = function (x, k) {
        return le.H.useDeferredValue(x, k)
    }, Ee.useEffect = function (x, k) {
        return le.H.useEffect(x, k)
    }, Ee.useEffectEvent = function (x) {
        return le.H.useEffectEvent(x)
    }, Ee.useId = function () {
        return le.H.useId()
    }, Ee.useImperativeHandle = function (x, k, I) {
        return le.H.useImperativeHandle(x, k, I)
    }, Ee.useInsertionEffect = function (x, k) {
        return le.H.useInsertionEffect(x, k)
    }, Ee.useLayoutEffect = function (x, k) {
        return le.H.useLayoutEffect(x, k)
    }, Ee.useMemo = function (x, k) {
        return le.H.useMemo(x, k)
    }, Ee.useOptimistic = function (x, k) {
        return le.H.useOptimistic(x, k)
    }, Ee.useReducer = function (x, k, I) {
        return le.H.useReducer(x, k, I)
    }, Ee.useRef = function (x) {
        return le.H.useRef(x)
    }, Ee.useState = function (x) {
        return le.H.useState(x)
    }, Ee.useSyncExternalStore = function (x, k, I) {
        return le.H.useSyncExternalStore(x, k, I)
    }, Ee.useTransition = function () {
        return le.H.useTransition()
    }, Ee.version = "19.2.7", Ee
}

var ny;

function zf() {
    return ny || (ny = 1, Vc.exports = y_()), Vc.exports
}

var D = zf();
const Zt = H0(D);
var yv = D.createContext(void 0), Qa = n => {
    const i = D.useContext(yv);
    if (!i) throw new Error("No QueryClient set, use QueryClientProvider to set one");
    return i
}, v_ = ({client: n, children: i}) => (D.useEffect(() => (n.mount(), () => {
    n.unmount()
}), [n]), p.jsx(yv.Provider, {value: n, children: i})), vv = D.createContext(!1), g_ = () => D.useContext(vv);
vv.Provider;

function b_() {
    let n = !1;
    return {
        clearReset: () => {
            n = !1
        }, reset: () => {
            n = !0
        }, isReset: () => n
    }
}

var __ = D.createContext(b_()), S_ = () => D.useContext(__), E_ = (n, i, r) => {
        const u = r?.state.error && typeof n.throwOnError == "function" ? Ef(n.throwOnError, [r.state.error, r]) : n.throwOnError;
        (n.suspense || n.experimental_prefetchInRender || u) && (i.isReset() || (n.retryOnMount = !1))
    }, x_ = n => {
        D.useEffect(() => {
            n.clearReset()
        }, [n])
    }, z_ = ({
                 result: n,
                 errorResetBoundary: i,
                 throwOnError: r,
                 query: u,
                 suspense: o
             }) => n.isError && !i.isReset() && !n.isFetching && u && (o && n.data === void 0 || Ef(r, [n.error, u])),
    O_ = n => {
        if (n.suspense) {
            const r = o => o === "static" ? o : Math.max(o ?? 1e3, 1e3), u = n.staleTime;
            n.staleTime = typeof u == "function" ? (...o) => r(u(...o)) : r(u), typeof n.gcTime == "number" && (n.gcTime = Math.max(n.gcTime, 1e3))
        }
    }, T_ = (n, i) => n.isLoading && n.isFetching && !i, j_ = (n, i) => n?.suspense && i.isPending,
    ay = (n, i, r) => i.fetchOptimistic(n).catch(() => {
        r.clearReset()
    });

function A_(n, i, r) {
    const u = g_(), o = S_(), f = Qa(), d = f.defaultQueryOptions(n);
    f.getDefaultOptions().queries?._experimental_beforeQuery?.(d);
    const m = f.getQueryCache().get(d.queryHash), y = n.subscribed !== !1;
    d._optimisticResults = u ? "isRestoring" : y ? "optimistic" : void 0, O_(d), E_(d, o, m), x_(o);
    const v = !f.getQueryCache().get(d.queryHash), [b] = D.useState(() => new i(f, d)), S = b.getOptimisticResult(d),
        T = !u && y;
    if (D.useSyncExternalStore(D.useCallback(R => {
        const q = T ? b.subscribe(zt.batchCalls(R)) : Ht;
        return b.updateResult(), q
    }, [b, T]), () => b.getCurrentResult(), () => b.getCurrentResult()), D.useEffect(() => {
        b.setOptions(d)
    }, [d, b]), j_(d, S)) throw ay(d, b, o);
    if (z_({
        result: S,
        errorResetBoundary: o,
        throwOnError: d.throwOnError,
        query: m,
        suspense: d.suspense
    })) throw S.error;
    return f.getDefaultOptions().queries?._experimental_afterQuery?.(d, S), d.experimental_prefetchInRender && !Er.isServer() && T_(S, u) && (v ? ay(d, b, o) : m?.promise)?.catch(Ht).finally(() => {
        b.updateResult()
    }), d.notifyOnChangeProps ? S : b.trackResult(S)
}

function xt(n, i) {
    return A_(n, s_)
}

function kt(n, i) {
    const r = Qa(), [u] = D.useState(() => new h_(r, n));
    D.useEffect(() => {
        u.setOptions(n)
    }, [u, n]);
    const o = D.useSyncExternalStore(D.useCallback(d => u.subscribe(zt.batchCalls(d)), [u]), () => u.getCurrentResult(), () => u.getCurrentResult()),
        f = D.useCallback((d, m) => {
            u.mutate(d, m).catch(Ht)
        }, [u]);
    if (o.error && Ef(u.options.throwOnError, [o.error])) throw o.error;
    return {...o, mutate: f, mutateAsync: o.mutate}
}

var $c = {exports: {}}, hr = {}, Qc = {exports: {}}, Yc = {};
var iy;

function R_() {
    return iy || (iy = 1, (function (n) {
        function i(Z, K) {
            var ue = Z.length;
            Z.push(K);
            e:for (; 0 < ue;) {
                var xe = ue - 1 >>> 1, Ae = Z[xe];
                if (0 < o(Ae, K)) Z[xe] = K, Z[ue] = Ae, ue = xe; else break e
            }
        }

        function r(Z) {
            return Z.length === 0 ? null : Z[0]
        }

        function u(Z) {
            if (Z.length === 0) return null;
            var K = Z[0], ue = Z.pop();
            if (ue !== K) {
                Z[0] = ue;
                e:for (var xe = 0, Ae = Z.length, x = Ae >>> 1; xe < x;) {
                    var k = 2 * (xe + 1) - 1, I = Z[k], F = k + 1, ye = Z[F];
                    if (0 > o(I, ue)) F < Ae && 0 > o(ye, I) ? (Z[xe] = ye, Z[F] = ue, xe = F) : (Z[xe] = I, Z[k] = ue, xe = k); else if (F < Ae && 0 > o(ye, ue)) Z[xe] = ye, Z[F] = ue, xe = F; else break e
                }
            }
            return K
        }

        function o(Z, K) {
            var ue = Z.sortIndex - K.sortIndex;
            return ue !== 0 ? ue : Z.id - K.id
        }

        if (n.unstable_now = void 0, typeof performance == "object" && typeof performance.now == "function") {
            var f = performance;
            n.unstable_now = function () {
                return f.now()
            }
        } else {
            var d = Date, m = d.now();
            n.unstable_now = function () {
                return d.now() - m
            }
        }
        var y = [], v = [], b = 1, S = null, T = 3, R = !1, q = !1, V = !1, U = !1,
            J = typeof setTimeout == "function" ? setTimeout : null,
            G = typeof clearTimeout == "function" ? clearTimeout : null,
            W = typeof setImmediate < "u" ? setImmediate : null;

        function Y(Z) {
            for (var K = r(v); K !== null;) {
                if (K.callback === null) u(v); else if (K.startTime <= Z) u(v), K.sortIndex = K.expirationTime, i(y, K); else break;
                K = r(v)
            }
        }

        function te(Z) {
            if (V = !1, Y(Z), !q) if (r(y) !== null) q = !0, Te || (Te = !0, fe()); else {
                var K = r(v);
                K !== null && ge(te, K.startTime - Z)
            }
        }

        var Te = !1, le = -1, be = 5, qe = -1;

        function Le() {
            return U ? !0 : !(n.unstable_now() - qe < be)
        }

        function Ie() {
            if (U = !1, Te) {
                var Z = n.unstable_now();
                qe = Z;
                var K = !0;
                try {
                    e:{
                        q = !1, V && (V = !1, G(le), le = -1), R = !0;
                        var ue = T;
                        try {
                            t:{
                                for (Y(Z), S = r(y); S !== null && !(S.expirationTime > Z && Le());) {
                                    var xe = S.callback;
                                    if (typeof xe == "function") {
                                        S.callback = null, T = S.priorityLevel;
                                        var Ae = xe(S.expirationTime <= Z);
                                        if (Z = n.unstable_now(), typeof Ae == "function") {
                                            S.callback = Ae, Y(Z), K = !0;
                                            break t
                                        }
                                        S === r(y) && u(y), Y(Z)
                                    } else u(y);
                                    S = r(y)
                                }
                                if (S !== null) K = !0; else {
                                    var x = r(v);
                                    x !== null && ge(te, x.startTime - Z), K = !1
                                }
                            }
                            break e
                        } finally {
                            S = null, T = ue, R = !1
                        }
                        K = void 0
                    }
                } finally {
                    K ? fe() : Te = !1
                }
            }
        }

        var fe;
        if (typeof W == "function") fe = function () {
            W(Ie)
        }; else if (typeof MessageChannel < "u") {
            var de = new MessageChannel, je = de.port2;
            de.port1.onmessage = Ie, fe = function () {
                je.postMessage(null)
            }
        } else fe = function () {
            J(Ie, 0)
        };

        function ge(Z, K) {
            le = J(function () {
                Z(n.unstable_now())
            }, K)
        }

        n.unstable_IdlePriority = 5, n.unstable_ImmediatePriority = 1, n.unstable_LowPriority = 4, n.unstable_NormalPriority = 3, n.unstable_Profiling = null, n.unstable_UserBlockingPriority = 2, n.unstable_cancelCallback = function (Z) {
            Z.callback = null
        }, n.unstable_forceFrameRate = function (Z) {
            0 > Z || 125 < Z ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : be = 0 < Z ? Math.floor(1e3 / Z) : 5
        }, n.unstable_getCurrentPriorityLevel = function () {
            return T
        }, n.unstable_next = function (Z) {
            switch (T) {
                case 1:
                case 2:
                case 3:
                    var K = 3;
                    break;
                default:
                    K = T
            }
            var ue = T;
            T = K;
            try {
                return Z()
            } finally {
                T = ue
            }
        }, n.unstable_requestPaint = function () {
            U = !0
        }, n.unstable_runWithPriority = function (Z, K) {
            switch (Z) {
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                    break;
                default:
                    Z = 3
            }
            var ue = T;
            T = Z;
            try {
                return K()
            } finally {
                T = ue
            }
        }, n.unstable_scheduleCallback = function (Z, K, ue) {
            var xe = n.unstable_now();
            switch (typeof ue == "object" && ue !== null ? (ue = ue.delay, ue = typeof ue == "number" && 0 < ue ? xe + ue : xe) : ue = xe, Z) {
                case 1:
                    var Ae = -1;
                    break;
                case 2:
                    Ae = 250;
                    break;
                case 5:
                    Ae = 1073741823;
                    break;
                case 4:
                    Ae = 1e4;
                    break;
                default:
                    Ae = 5e3
            }
            return Ae = ue + Ae, Z = {
                id: b++,
                callback: K,
                priorityLevel: Z,
                startTime: ue,
                expirationTime: Ae,
                sortIndex: -1
            }, ue > xe ? (Z.sortIndex = ue, i(v, Z), r(y) === null && Z === r(v) && (V ? (G(le), le = -1) : V = !0, ge(te, ue - xe))) : (Z.sortIndex = Ae, i(y, Z), q || R || (q = !0, Te || (Te = !0, fe()))), Z
        }, n.unstable_shouldYield = Le, n.unstable_wrapCallback = function (Z) {
            var K = T;
            return function () {
                var ue = T;
                T = K;
                try {
                    return Z.apply(this, arguments)
                } finally {
                    T = ue
                }
            }
        }
    })(Yc)), Yc
}

var ly;

function w_() {
    return ly || (ly = 1, Qc.exports = R_()), Qc.exports
}

var Gc = {exports: {}}, Ut = {};
var ry;

function N_() {
    if (ry) return Ut;
    ry = 1;
    var n = zf();

    function i(y) {
        var v = "https://react.dev/errors/" + y;
        if (1 < arguments.length) {
            v += "?args[]=" + encodeURIComponent(arguments[1]);
            for (var b = 2; b < arguments.length; b++) v += "&args[]=" + encodeURIComponent(arguments[b])
        }
        return "Minified React error #" + y + "; visit " + v + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings."
    }

    function r() {
    }

    var u = {
        d: {
            f: r, r: function () {
                throw Error(i(522))
            }, D: r, C: r, L: r, m: r, X: r, S: r, M: r
        }, p: 0, findDOMNode: null
    }, o = Symbol.for("react.portal");

    function f(y, v, b) {
        var S = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
        return {$$typeof: o, key: S == null ? null : "" + S, children: y, containerInfo: v, implementation: b}
    }

    var d = n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

    function m(y, v) {
        if (y === "font") return "";
        if (typeof v == "string") return v === "use-credentials" ? v : ""
    }

    return Ut.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = u, Ut.createPortal = function (y, v) {
        var b = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
        if (!v || v.nodeType !== 1 && v.nodeType !== 9 && v.nodeType !== 11) throw Error(i(299));
        return f(y, v, null, b)
    }, Ut.flushSync = function (y) {
        var v = d.T, b = u.p;
        try {
            if (d.T = null, u.p = 2, y) return y()
        } finally {
            d.T = v, u.p = b, u.d.f()
        }
    }, Ut.preconnect = function (y, v) {
        typeof y == "string" && (v ? (v = v.crossOrigin, v = typeof v == "string" ? v === "use-credentials" ? v : "" : void 0) : v = null, u.d.C(y, v))
    }, Ut.prefetchDNS = function (y) {
        typeof y == "string" && u.d.D(y)
    }, Ut.preinit = function (y, v) {
        if (typeof y == "string" && v && typeof v.as == "string") {
            var b = v.as, S = m(b, v.crossOrigin), T = typeof v.integrity == "string" ? v.integrity : void 0,
                R = typeof v.fetchPriority == "string" ? v.fetchPriority : void 0;
            b === "style" ? u.d.S(y, typeof v.precedence == "string" ? v.precedence : void 0, {
                crossOrigin: S,
                integrity: T,
                fetchPriority: R
            }) : b === "script" && u.d.X(y, {
                crossOrigin: S,
                integrity: T,
                fetchPriority: R,
                nonce: typeof v.nonce == "string" ? v.nonce : void 0
            })
        }
    }, Ut.preinitModule = function (y, v) {
        if (typeof y == "string") if (typeof v == "object" && v !== null) {
            if (v.as == null || v.as === "script") {
                var b = m(v.as, v.crossOrigin);
                u.d.M(y, {
                    crossOrigin: b,
                    integrity: typeof v.integrity == "string" ? v.integrity : void 0,
                    nonce: typeof v.nonce == "string" ? v.nonce : void 0
                })
            }
        } else v == null && u.d.M(y)
    }, Ut.preload = function (y, v) {
        if (typeof y == "string" && typeof v == "object" && v !== null && typeof v.as == "string") {
            var b = v.as, S = m(b, v.crossOrigin);
            u.d.L(y, b, {
                crossOrigin: S,
                integrity: typeof v.integrity == "string" ? v.integrity : void 0,
                nonce: typeof v.nonce == "string" ? v.nonce : void 0,
                type: typeof v.type == "string" ? v.type : void 0,
                fetchPriority: typeof v.fetchPriority == "string" ? v.fetchPriority : void 0,
                referrerPolicy: typeof v.referrerPolicy == "string" ? v.referrerPolicy : void 0,
                imageSrcSet: typeof v.imageSrcSet == "string" ? v.imageSrcSet : void 0,
                imageSizes: typeof v.imageSizes == "string" ? v.imageSizes : void 0,
                media: typeof v.media == "string" ? v.media : void 0
            })
        }
    }, Ut.preloadModule = function (y, v) {
        if (typeof y == "string") if (v) {
            var b = m(v.as, v.crossOrigin);
            u.d.m(y, {
                as: typeof v.as == "string" && v.as !== "script" ? v.as : void 0,
                crossOrigin: b,
                integrity: typeof v.integrity == "string" ? v.integrity : void 0
            })
        } else u.d.m(y)
    }, Ut.requestFormReset = function (y) {
        u.d.r(y)
    }, Ut.unstable_batchedUpdates = function (y, v) {
        return y(v)
    }, Ut.useFormState = function (y, v, b) {
        return d.H.useFormState(y, v, b)
    }, Ut.useFormStatus = function () {
        return d.H.useHostTransitionStatus()
    }, Ut.version = "19.2.7", Ut
}

var uy;

function C_() {
    if (uy) return Gc.exports;
    uy = 1;

    function n() {
        if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function")) try {
            __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n)
        } catch (i) {
            console.error(i)
        }
    }

    return n(), Gc.exports = N_(), Gc.exports
}

var sy;

function D_() {
    if (sy) return hr;
    sy = 1;
    var n = w_(), i = zf(), r = C_();

    function u(e) {
        var t = "https://react.dev/errors/" + e;
        if (1 < arguments.length) {
            t += "?args[]=" + encodeURIComponent(arguments[1]);
            for (var a = 2; a < arguments.length; a++) t += "&args[]=" + encodeURIComponent(arguments[a])
        }
        return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings."
    }

    function o(e) {
        return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11)
    }

    function f(e) {
        var t = e, a = e;
        if (e.alternate) for (; t.return;) t = t.return; else {
            e = t;
            do t = e, (t.flags & 4098) !== 0 && (a = t.return), e = t.return; while (e)
        }
        return t.tag === 3 ? a : null
    }

    function d(e) {
        if (e.tag === 13) {
            var t = e.memoizedState;
            if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated
        }
        return null
    }

    function m(e) {
        if (e.tag === 31) {
            var t = e.memoizedState;
            if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated
        }
        return null
    }

    function y(e) {
        if (f(e) !== e) throw Error(u(188))
    }

    function v(e) {
        var t = e.alternate;
        if (!t) {
            if (t = f(e), t === null) throw Error(u(188));
            return t !== e ? null : e
        }
        for (var a = e, l = t; ;) {
            var s = a.return;
            if (s === null) break;
            var c = s.alternate;
            if (c === null) {
                if (l = s.return, l !== null) {
                    a = l;
                    continue
                }
                break
            }
            if (s.child === c.child) {
                for (c = s.child; c;) {
                    if (c === a) return y(s), e;
                    if (c === l) return y(s), t;
                    c = c.sibling
                }
                throw Error(u(188))
            }
            if (a.return !== l.return) a = s, l = c; else {
                for (var h = !1, g = s.child; g;) {
                    if (g === a) {
                        h = !0, a = s, l = c;
                        break
                    }
                    if (g === l) {
                        h = !0, l = s, a = c;
                        break
                    }
                    g = g.sibling
                }
                if (!h) {
                    for (g = c.child; g;) {
                        if (g === a) {
                            h = !0, a = c, l = s;
                            break
                        }
                        if (g === l) {
                            h = !0, l = c, a = s;
                            break
                        }
                        g = g.sibling
                    }
                    if (!h) throw Error(u(189))
                }
            }
            if (a.alternate !== l) throw Error(u(190))
        }
        if (a.tag !== 3) throw Error(u(188));
        return a.stateNode.current === a ? e : t
    }

    function b(e) {
        var t = e.tag;
        if (t === 5 || t === 26 || t === 27 || t === 6) return e;
        for (e = e.child; e !== null;) {
            if (t = b(e), t !== null) return t;
            e = e.sibling
        }
        return null
    }

    var S = Object.assign, T = Symbol.for("react.element"), R = Symbol.for("react.transitional.element"),
        q = Symbol.for("react.portal"), V = Symbol.for("react.fragment"), U = Symbol.for("react.strict_mode"),
        J = Symbol.for("react.profiler"), G = Symbol.for("react.consumer"), W = Symbol.for("react.context"),
        Y = Symbol.for("react.forward_ref"), te = Symbol.for("react.suspense"), Te = Symbol.for("react.suspense_list"),
        le = Symbol.for("react.memo"), be = Symbol.for("react.lazy"), qe = Symbol.for("react.activity"),
        Le = Symbol.for("react.memo_cache_sentinel"), Ie = Symbol.iterator;

    function fe(e) {
        return e === null || typeof e != "object" ? null : (e = Ie && e[Ie] || e["@@iterator"], typeof e == "function" ? e : null)
    }

    var de = Symbol.for("react.client.reference");

    function je(e) {
        if (e == null) return null;
        if (typeof e == "function") return e.$$typeof === de ? null : e.displayName || e.name || null;
        if (typeof e == "string") return e;
        switch (e) {
            case V:
                return "Fragment";
            case J:
                return "Profiler";
            case U:
                return "StrictMode";
            case te:
                return "Suspense";
            case Te:
                return "SuspenseList";
            case qe:
                return "Activity"
        }
        if (typeof e == "object") switch (e.$$typeof) {
            case q:
                return "Portal";
            case W:
                return e.displayName || "Context";
            case G:
                return (e._context.displayName || "Context") + ".Consumer";
            case Y:
                var t = e.render;
                return e = e.displayName, e || (e = t.displayName || t.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
            case le:
                return t = e.displayName || null, t !== null ? t : je(e.type) || "Memo";
            case be:
                t = e._payload, e = e._init;
                try {
                    return je(e(t))
                } catch {
                }
        }
        return null
    }

    var ge = Array.isArray, Z = i.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
        K = r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
        ue = {pending: !1, data: null, method: null, action: null}, xe = [], Ae = -1;

    function x(e) {
        return {current: e}
    }

    function k(e) {
        0 > Ae || (e.current = xe[Ae], xe[Ae] = null, Ae--)
    }

    function I(e, t) {
        Ae++, xe[Ae] = e.current, e.current = t
    }

    var F = x(null), ye = x(null), _e = x(null), Re = x(null);

    function lt(e, t) {
        switch (I(_e, t), I(ye, e), I(F, null), t.nodeType) {
            case 9:
            case 11:
                e = (e = t.documentElement) && (e = e.namespaceURI) ? hp(e) : 0;
                break;
            default:
                if (e = t.tagName, t = t.namespaceURI) t = hp(t), e = mp(t, e); else switch (e) {
                    case"svg":
                        e = 1;
                        break;
                    case"math":
                        e = 2;
                        break;
                    default:
                        e = 0
                }
        }
        k(F), I(F, e)
    }

    function He() {
        k(F), k(ye), k(_e)
    }

    function dn(e) {
        e.memoizedState !== null && I(Re, e);
        var t = F.current, a = mp(t, e.type);
        t !== a && (I(ye, e), I(F, a))
    }

    function hn(e) {
        ye.current === e && (k(F), k(ye)), Re.current === e && (k(Re), sr._currentValue = ue)
    }

    var Ln, z;

    function st(e) {
        if (Ln === void 0) try {
            throw Error()
        } catch (a) {
            var t = a.stack.trim().match(/\n( *(at )?)/);
            Ln = t && t[1] || "", z = -1 < a.stack.indexOf(`
    at`) ? " (<anonymous>)" : -1 < a.stack.indexOf("@") ? "@unknown:0:0" : ""
        }
        return `
` + Ln + e + z
    }

    var Fa = !1;

    function Xa(e, t) {
        if (!e || Fa) return "";
        Fa = !0;
        var a = Error.prepareStackTrace;
        Error.prepareStackTrace = void 0;
        try {
            var l = {
                DetermineComponentFrameRoot: function () {
                    try {
                        if (t) {
                            var Q = function () {
                                throw Error()
                            };
                            if (Object.defineProperty(Q.prototype, "props", {
                                set: function () {
                                    throw Error()
                                }
                            }), typeof Reflect == "object" && Reflect.construct) {
                                try {
                                    Reflect.construct(Q, [])
                                } catch (L) {
                                    var M = L
                                }
                                Reflect.construct(e, [], Q)
                            } else {
                                try {
                                    Q.call()
                                } catch (L) {
                                    M = L
                                }
                                e.call(Q.prototype)
                            }
                        } else {
                            try {
                                throw Error()
                            } catch (L) {
                                M = L
                            }
                            (Q = e()) && typeof Q.catch == "function" && Q.catch(function () {
                            })
                        }
                    } catch (L) {
                        if (L && M && typeof L.stack == "string") return [L.stack, M.stack]
                    }
                    return [null, null]
                }
            };
            l.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
            var s = Object.getOwnPropertyDescriptor(l.DetermineComponentFrameRoot, "name");
            s && s.configurable && Object.defineProperty(l.DetermineComponentFrameRoot, "name", {value: "DetermineComponentFrameRoot"});
            var c = l.DetermineComponentFrameRoot(), h = c[0], g = c[1];
            if (h && g) {
                var E = h.split(`
`), C = g.split(`
`);
                for (s = l = 0; l < E.length && !E[l].includes("DetermineComponentFrameRoot");) l++;
                for (; s < C.length && !C[s].includes("DetermineComponentFrameRoot");) s++;
                if (l === E.length || s === C.length) for (l = E.length - 1, s = C.length - 1; 1 <= l && 0 <= s && E[l] !== C[s];) s--;
                for (; 1 <= l && 0 <= s; l--, s--) if (E[l] !== C[s]) {
                    if (l !== 1 || s !== 1) do if (l--, s--, 0 > s || E[l] !== C[s]) {
                        var B = `
` + E[l].replace(" at new ", " at ");
                        return e.displayName && B.includes("<anonymous>") && (B = B.replace("<anonymous>", e.displayName)), B
                    } while (1 <= l && 0 <= s);
                    break
                }
            }
        } finally {
            Fa = !1, Error.prepareStackTrace = a
        }
        return (a = e ? e.displayName || e.name : "") ? st(a) : ""
    }

    function Os(e, t) {
        switch (e.tag) {
            case 26:
            case 27:
            case 5:
                return st(e.type);
            case 16:
                return st("Lazy");
            case 13:
                return e.child !== t && t !== null ? st("Suspense Fallback") : st("Suspense");
            case 19:
                return st("SuspenseList");
            case 0:
            case 15:
                return Xa(e.type, !1);
            case 11:
                return Xa(e.type.render, !1);
            case 1:
                return Xa(e.type, !0);
            case 31:
                return st("Activity");
            default:
                return ""
        }
    }

    function bl(e) {
        try {
            var t = "", a = null;
            do t += Os(e, a), a = e, e = e.return; while (e);
            return t
        } catch (l) {
            return `
Error generating stack: ` + l.message + `
` + l.stack
        }
    }

    var _l = Object.prototype.hasOwnProperty, _i = n.unstable_scheduleCallback, Si = n.unstable_cancelCallback,
        Ts = n.unstable_shouldYield, js = n.unstable_requestPaint, $t = n.unstable_now,
        Ff = n.unstable_getCurrentPriorityLevel, Sl = n.unstable_ImmediatePriority, _ = n.unstable_UserBlockingPriority,
        j = n.unstable_NormalPriority, w = n.unstable_LowPriority, X = n.unstable_IdlePriority, ee = n.log,
        ne = n.unstable_setDisableYieldValue, P = null, ae = null;

    function Se(e) {
        if (typeof ee == "function" && ne(e), ae && typeof ae.setStrictMode == "function") try {
            ae.setStrictMode(P, e)
        } catch {
        }
    }

    var Ze = Math.clz32 ? Math.clz32 : Xn, Qt = Math.log, Wt = Math.LN2;

    function Xn(e) {
        return e >>>= 0, e === 0 ? 32 : 31 - (Qt(e) / Wt | 0) | 0
    }

    var ya = 256, qn = 262144, Ei = 4194304;

    function Bn(e) {
        var t = e & 42;
        if (t !== 0) return t;
        switch (e & -e) {
            case 1:
                return 1;
            case 2:
                return 2;
            case 4:
                return 4;
            case 8:
                return 8;
            case 16:
                return 16;
            case 32:
                return 32;
            case 64:
                return 64;
            case 128:
                return 128;
            case 256:
            case 512:
            case 1024:
            case 2048:
            case 4096:
            case 8192:
            case 16384:
            case 32768:
            case 65536:
            case 131072:
                return e & 261888;
            case 262144:
            case 524288:
            case 1048576:
            case 2097152:
                return e & 3932160;
            case 4194304:
            case 8388608:
            case 16777216:
            case 33554432:
                return e & 62914560;
            case 67108864:
                return 67108864;
            case 134217728:
                return 134217728;
            case 268435456:
                return 268435456;
            case 536870912:
                return 536870912;
            case 1073741824:
                return 0;
            default:
                return e
        }
    }

    function xi(e, t, a) {
        var l = e.pendingLanes;
        if (l === 0) return 0;
        var s = 0, c = e.suspendedLanes, h = e.pingedLanes;
        e = e.warmLanes;
        var g = l & 134217727;
        return g !== 0 ? (l = g & ~c, l !== 0 ? s = Bn(l) : (h &= g, h !== 0 ? s = Bn(h) : a || (a = g & ~e, a !== 0 && (s = Bn(a))))) : (g = l & ~c, g !== 0 ? s = Bn(g) : h !== 0 ? s = Bn(h) : a || (a = l & ~e, a !== 0 && (s = Bn(a)))), s === 0 ? 0 : t !== 0 && t !== s && (t & c) === 0 && (c = s & -s, a = t & -t, c >= a || c === 32 && (a & 4194048) !== 0) ? t : s
    }

    function va(e, t) {
        return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0
    }

    function Ag(e, t) {
        switch (e) {
            case 1:
            case 2:
            case 4:
            case 8:
            case 64:
                return t + 250;
            case 16:
            case 32:
            case 128:
            case 256:
            case 512:
            case 1024:
            case 2048:
            case 4096:
            case 8192:
            case 16384:
            case 32768:
            case 65536:
            case 131072:
            case 262144:
            case 524288:
            case 1048576:
            case 2097152:
                return t + 5e3;
            case 4194304:
            case 8388608:
            case 16777216:
            case 33554432:
                return -1;
            case 67108864:
            case 134217728:
            case 268435456:
            case 536870912:
            case 1073741824:
                return -1;
            default:
                return -1
        }
    }

    function Xf() {
        var e = Ei;
        return Ei <<= 1, (Ei & 62914560) === 0 && (Ei = 4194304), e
    }

    function As(e) {
        for (var t = [], a = 0; 31 > a; a++) t.push(e);
        return t
    }

    function El(e, t) {
        e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0)
    }

    function Rg(e, t, a, l, s, c) {
        var h = e.pendingLanes;
        e.pendingLanes = a, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= a, e.entangledLanes &= a, e.errorRecoveryDisabledLanes &= a, e.shellSuspendCounter = 0;
        var g = e.entanglements, E = e.expirationTimes, C = e.hiddenUpdates;
        for (a = h & ~a; 0 < a;) {
            var B = 31 - Ze(a), Q = 1 << B;
            g[B] = 0, E[B] = -1;
            var M = C[B];
            if (M !== null) for (C[B] = null, B = 0; B < M.length; B++) {
                var L = M[B];
                L !== null && (L.lane &= -536870913)
            }
            a &= ~Q
        }
        l !== 0 && Jf(e, l, 0), c !== 0 && s === 0 && e.tag !== 0 && (e.suspendedLanes |= c & ~(h & ~t))
    }

    function Jf(e, t, a) {
        e.pendingLanes |= t, e.suspendedLanes &= ~t;
        var l = 31 - Ze(t);
        e.entangledLanes |= t, e.entanglements[l] = e.entanglements[l] | 1073741824 | a & 261930
    }

    function Kf(e, t) {
        var a = e.entangledLanes |= t;
        for (e = e.entanglements; a;) {
            var l = 31 - Ze(a), s = 1 << l;
            s & t | e[l] & t && (e[l] |= t), a &= ~s
        }
    }

    function Pf(e, t) {
        var a = t & -t;
        return a = (a & 42) !== 0 ? 1 : Rs(a), (a & (e.suspendedLanes | t)) !== 0 ? 0 : a
    }

    function Rs(e) {
        switch (e) {
            case 2:
                e = 1;
                break;
            case 8:
                e = 4;
                break;
            case 32:
                e = 16;
                break;
            case 256:
            case 512:
            case 1024:
            case 2048:
            case 4096:
            case 8192:
            case 16384:
            case 32768:
            case 65536:
            case 131072:
            case 262144:
            case 524288:
            case 1048576:
            case 2097152:
            case 4194304:
            case 8388608:
            case 16777216:
            case 33554432:
                e = 128;
                break;
            case 268435456:
                e = 134217728;
                break;
            default:
                e = 0
        }
        return e
    }

    function ws(e) {
        return e &= -e, 2 < e ? 8 < e ? (e & 134217727) !== 0 ? 32 : 268435456 : 8 : 2
    }

    function If() {
        var e = K.p;
        return e !== 0 ? e : (e = window.event, e === void 0 ? 32 : Lp(e.type))
    }

    function Wf(e, t) {
        var a = K.p;
        try {
            return K.p = e, t()
        } finally {
            K.p = a
        }
    }

    var ga = Math.random().toString(36).slice(2), At = "__reactFiber$" + ga, Yt = "__reactProps$" + ga,
        zi = "__reactContainer$" + ga, Ns = "__reactEvents$" + ga, wg = "__reactListeners$" + ga,
        Ng = "__reactHandles$" + ga, ed = "__reactResources$" + ga, xl = "__reactMarker$" + ga;

    function Cs(e) {
        delete e[At], delete e[Yt], delete e[Ns], delete e[wg], delete e[Ng]
    }

    function Oi(e) {
        var t = e[At];
        if (t) return t;
        for (var a = e.parentNode; a;) {
            if (t = a[zi] || a[At]) {
                if (a = t.alternate, t.child !== null || a !== null && a.child !== null) for (e = Sp(e); e !== null;) {
                    if (a = e[At]) return a;
                    e = Sp(e)
                }
                return t
            }
            e = a, a = e.parentNode
        }
        return null
    }

    function Ti(e) {
        if (e = e[At] || e[zi]) {
            var t = e.tag;
            if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e
        }
        return null
    }

    function zl(e) {
        var t = e.tag;
        if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
        throw Error(u(33))
    }

    function ji(e) {
        var t = e[ed];
        return t || (t = e[ed] = {hoistableStyles: new Map, hoistableScripts: new Map}), t
    }

    function Ot(e) {
        e[xl] = !0
    }

    var td = new Set, nd = {};

    function Ja(e, t) {
        Ai(e, t), Ai(e + "Capture", t)
    }

    function Ai(e, t) {
        for (nd[e] = t, e = 0; e < t.length; e++) td.add(t[e])
    }

    var Cg = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"),
        ad = {}, id = {};

    function Dg(e) {
        return _l.call(id, e) ? !0 : _l.call(ad, e) ? !1 : Cg.test(e) ? id[e] = !0 : (ad[e] = !0, !1)
    }

    function Ur(e, t, a) {
        if (Dg(t)) if (a === null) e.removeAttribute(t); else {
            switch (typeof a) {
                case"undefined":
                case"function":
                case"symbol":
                    e.removeAttribute(t);
                    return;
                case"boolean":
                    var l = t.toLowerCase().slice(0, 5);
                    if (l !== "data-" && l !== "aria-") {
                        e.removeAttribute(t);
                        return
                    }
            }
            e.setAttribute(t, "" + a)
        }
    }

    function Zr(e, t, a) {
        if (a === null) e.removeAttribute(t); else {
            switch (typeof a) {
                case"undefined":
                case"function":
                case"symbol":
                case"boolean":
                    e.removeAttribute(t);
                    return
            }
            e.setAttribute(t, "" + a)
        }
    }

    function Jn(e, t, a, l) {
        if (l === null) e.removeAttribute(a); else {
            switch (typeof l) {
                case"undefined":
                case"function":
                case"symbol":
                case"boolean":
                    e.removeAttribute(a);
                    return
            }
            e.setAttributeNS(t, a, "" + l)
        }
    }

    function mn(e) {
        switch (typeof e) {
            case"bigint":
            case"boolean":
            case"number":
            case"string":
            case"undefined":
                return e;
            case"object":
                return e;
            default:
                return ""
        }
    }

    function ld(e) {
        var t = e.type;
        return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio")
    }

    function Mg(e, t, a) {
        var l = Object.getOwnPropertyDescriptor(e.constructor.prototype, t);
        if (!e.hasOwnProperty(t) && typeof l < "u" && typeof l.get == "function" && typeof l.set == "function") {
            var s = l.get, c = l.set;
            return Object.defineProperty(e, t, {
                configurable: !0, get: function () {
                    return s.call(this)
                }, set: function (h) {
                    a = "" + h, c.call(this, h)
                }
            }), Object.defineProperty(e, t, {enumerable: l.enumerable}), {
                getValue: function () {
                    return a
                }, setValue: function (h) {
                    a = "" + h
                }, stopTracking: function () {
                    e._valueTracker = null, delete e[t]
                }
            }
        }
    }

    function Ds(e) {
        if (!e._valueTracker) {
            var t = ld(e) ? "checked" : "value";
            e._valueTracker = Mg(e, t, "" + e[t])
        }
    }

    function rd(e) {
        if (!e) return !1;
        var t = e._valueTracker;
        if (!t) return !0;
        var a = t.getValue(), l = "";
        return e && (l = ld(e) ? e.checked ? "true" : "false" : e.value), e = l, e !== a ? (t.setValue(e), !0) : !1
    }

    function Lr(e) {
        if (e = e || (typeof document < "u" ? document : void 0), typeof e > "u") return null;
        try {
            return e.activeElement || e.body
        } catch {
            return e.body
        }
    }

    var Ug = /[\n"\\]/g;

    function pn(e) {
        return e.replace(Ug, function (t) {
            return "\\" + t.charCodeAt(0).toString(16) + " "
        })
    }

    function Ms(e, t, a, l, s, c, h, g) {
        e.name = "", h != null && typeof h != "function" && typeof h != "symbol" && typeof h != "boolean" ? e.type = h : e.removeAttribute("type"), t != null ? h === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + mn(t)) : e.value !== "" + mn(t) && (e.value = "" + mn(t)) : h !== "submit" && h !== "reset" || e.removeAttribute("value"), t != null ? Us(e, h, mn(t)) : a != null ? Us(e, h, mn(a)) : l != null && e.removeAttribute("value"), s == null && c != null && (e.defaultChecked = !!c), s != null && (e.checked = s && typeof s != "function" && typeof s != "symbol"), g != null && typeof g != "function" && typeof g != "symbol" && typeof g != "boolean" ? e.name = "" + mn(g) : e.removeAttribute("name")
    }

    function ud(e, t, a, l, s, c, h, g) {
        if (c != null && typeof c != "function" && typeof c != "symbol" && typeof c != "boolean" && (e.type = c), t != null || a != null) {
            if (!(c !== "submit" && c !== "reset" || t != null)) {
                Ds(e);
                return
            }
            a = a != null ? "" + mn(a) : "", t = t != null ? "" + mn(t) : a, g || t === e.value || (e.value = t), e.defaultValue = t
        }
        l = l ?? s, l = typeof l != "function" && typeof l != "symbol" && !!l, e.checked = g ? e.checked : !!l, e.defaultChecked = !!l, h != null && typeof h != "function" && typeof h != "symbol" && typeof h != "boolean" && (e.name = h), Ds(e)
    }

    function Us(e, t, a) {
        t === "number" && Lr(e.ownerDocument) === e || e.defaultValue === "" + a || (e.defaultValue = "" + a)
    }

    function Ri(e, t, a, l) {
        if (e = e.options, t) {
            t = {};
            for (var s = 0; s < a.length; s++) t["$" + a[s]] = !0;
            for (a = 0; a < e.length; a++) s = t.hasOwnProperty("$" + e[a].value), e[a].selected !== s && (e[a].selected = s), s && l && (e[a].defaultSelected = !0)
        } else {
            for (a = "" + mn(a), t = null, s = 0; s < e.length; s++) {
                if (e[s].value === a) {
                    e[s].selected = !0, l && (e[s].defaultSelected = !0);
                    return
                }
                t !== null || e[s].disabled || (t = e[s])
            }
            t !== null && (t.selected = !0)
        }
    }

    function sd(e, t, a) {
        if (t != null && (t = "" + mn(t), t !== e.value && (e.value = t), a == null)) {
            e.defaultValue !== t && (e.defaultValue = t);
            return
        }
        e.defaultValue = a != null ? "" + mn(a) : ""
    }

    function od(e, t, a, l) {
        if (t == null) {
            if (l != null) {
                if (a != null) throw Error(u(92));
                if (ge(l)) {
                    if (1 < l.length) throw Error(u(93));
                    l = l[0]
                }
                a = l
            }
            a == null && (a = ""), t = a
        }
        a = mn(t), e.defaultValue = a, l = e.textContent, l === a && l !== "" && l !== null && (e.value = l), Ds(e)
    }

    function wi(e, t) {
        if (t) {
            var a = e.firstChild;
            if (a && a === e.lastChild && a.nodeType === 3) {
                a.nodeValue = t;
                return
            }
        }
        e.textContent = t
    }

    var Zg = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));

    function cd(e, t, a) {
        var l = t.indexOf("--") === 0;
        a == null || typeof a == "boolean" || a === "" ? l ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : l ? e.setProperty(t, a) : typeof a != "number" || a === 0 || Zg.has(t) ? t === "float" ? e.cssFloat = a : e[t] = ("" + a).trim() : e[t] = a + "px"
    }

    function fd(e, t, a) {
        if (t != null && typeof t != "object") throw Error(u(62));
        if (e = e.style, a != null) {
            for (var l in a) !a.hasOwnProperty(l) || t != null && t.hasOwnProperty(l) || (l.indexOf("--") === 0 ? e.setProperty(l, "") : l === "float" ? e.cssFloat = "" : e[l] = "");
            for (var s in t) l = t[s], t.hasOwnProperty(s) && a[s] !== l && cd(e, s, l)
        } else for (var c in t) t.hasOwnProperty(c) && cd(e, c, t[c])
    }

    function Zs(e) {
        if (e.indexOf("-") === -1) return !1;
        switch (e) {
            case"annotation-xml":
            case"color-profile":
            case"font-face":
            case"font-face-src":
            case"font-face-uri":
            case"font-face-format":
            case"font-face-name":
            case"missing-glyph":
                return !1;
            default:
                return !0
        }
    }

    var Lg = new Map([["acceptCharset", "accept-charset"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"], ["crossOrigin", "crossorigin"], ["accentHeight", "accent-height"], ["alignmentBaseline", "alignment-baseline"], ["arabicForm", "arabic-form"], ["baselineShift", "baseline-shift"], ["capHeight", "cap-height"], ["clipPath", "clip-path"], ["clipRule", "clip-rule"], ["colorInterpolation", "color-interpolation"], ["colorInterpolationFilters", "color-interpolation-filters"], ["colorProfile", "color-profile"], ["colorRendering", "color-rendering"], ["dominantBaseline", "dominant-baseline"], ["enableBackground", "enable-background"], ["fillOpacity", "fill-opacity"], ["fillRule", "fill-rule"], ["floodColor", "flood-color"], ["floodOpacity", "flood-opacity"], ["fontFamily", "font-family"], ["fontSize", "font-size"], ["fontSizeAdjust", "font-size-adjust"], ["fontStretch", "font-stretch"], ["fontStyle", "font-style"], ["fontVariant", "font-variant"], ["fontWeight", "font-weight"], ["glyphName", "glyph-name"], ["glyphOrientationHorizontal", "glyph-orientation-horizontal"], ["glyphOrientationVertical", "glyph-orientation-vertical"], ["horizAdvX", "horiz-adv-x"], ["horizOriginX", "horiz-origin-x"], ["imageRendering", "image-rendering"], ["letterSpacing", "letter-spacing"], ["lightingColor", "lighting-color"], ["markerEnd", "marker-end"], ["markerMid", "marker-mid"], ["markerStart", "marker-start"], ["overlinePosition", "overline-position"], ["overlineThickness", "overline-thickness"], ["paintOrder", "paint-order"], ["panose-1", "panose-1"], ["pointerEvents", "pointer-events"], ["renderingIntent", "rendering-intent"], ["shapeRendering", "shape-rendering"], ["stopColor", "stop-color"], ["stopOpacity", "stop-opacity"], ["strikethroughPosition", "strikethrough-position"], ["strikethroughThickness", "strikethrough-thickness"], ["strokeDasharray", "stroke-dasharray"], ["strokeDashoffset", "stroke-dashoffset"], ["strokeLinecap", "stroke-linecap"], ["strokeLinejoin", "stroke-linejoin"], ["strokeMiterlimit", "stroke-miterlimit"], ["strokeOpacity", "stroke-opacity"], ["strokeWidth", "stroke-width"], ["textAnchor", "text-anchor"], ["textDecoration", "text-decoration"], ["textRendering", "text-rendering"], ["transformOrigin", "transform-origin"], ["underlinePosition", "underline-position"], ["underlineThickness", "underline-thickness"], ["unicodeBidi", "unicode-bidi"], ["unicodeRange", "unicode-range"], ["unitsPerEm", "units-per-em"], ["vAlphabetic", "v-alphabetic"], ["vHanging", "v-hanging"], ["vIdeographic", "v-ideographic"], ["vMathematical", "v-mathematical"], ["vectorEffect", "vector-effect"], ["vertAdvY", "vert-adv-y"], ["vertOriginX", "vert-origin-x"], ["vertOriginY", "vert-origin-y"], ["wordSpacing", "word-spacing"], ["writingMode", "writing-mode"], ["xmlnsXlink", "xmlns:xlink"], ["xHeight", "x-height"]]),
        qg = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;

    function qr(e) {
        return qg.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e
    }

    function Kn() {
    }

    var Ls = null;

    function qs(e) {
        return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e
    }

    var Ni = null, Ci = null;

    function dd(e) {
        var t = Ti(e);
        if (t && (e = t.stateNode)) {
            var a = e[Yt] || null;
            e:switch (e = t.stateNode, t.type) {
                case"input":
                    if (Ms(e, a.value, a.defaultValue, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name), t = a.name, a.type === "radio" && t != null) {
                        for (a = e; a.parentNode;) a = a.parentNode;
                        for (a = a.querySelectorAll('input[name="' + pn("" + t) + '"][type="radio"]'), t = 0; t < a.length; t++) {
                            var l = a[t];
                            if (l !== e && l.form === e.form) {
                                var s = l[Yt] || null;
                                if (!s) throw Error(u(90));
                                Ms(l, s.value, s.defaultValue, s.defaultValue, s.checked, s.defaultChecked, s.type, s.name)
                            }
                        }
                        for (t = 0; t < a.length; t++) l = a[t], l.form === e.form && rd(l)
                    }
                    break e;
                case"textarea":
                    sd(e, a.value, a.defaultValue);
                    break e;
                case"select":
                    t = a.value, t != null && Ri(e, !!a.multiple, t, !1)
            }
        }
    }

    var Bs = !1;

    function hd(e, t, a) {
        if (Bs) return e(t, a);
        Bs = !0;
        try {
            var l = e(t);
            return l
        } finally {
            if (Bs = !1, (Ni !== null || Ci !== null) && (Ou(), Ni && (t = Ni, e = Ci, Ci = Ni = null, dd(t), e))) for (t = 0; t < e.length; t++) dd(e[t])
        }
    }

    function Ol(e, t) {
        var a = e.stateNode;
        if (a === null) return null;
        var l = a[Yt] || null;
        if (l === null) return null;
        a = l[t];
        e:switch (t) {
            case"onClick":
            case"onClickCapture":
            case"onDoubleClick":
            case"onDoubleClickCapture":
            case"onMouseDown":
            case"onMouseDownCapture":
            case"onMouseMove":
            case"onMouseMoveCapture":
            case"onMouseUp":
            case"onMouseUpCapture":
            case"onMouseEnter":
                (l = !l.disabled) || (e = e.type, l = !(e === "button" || e === "input" || e === "select" || e === "textarea")), e = !l;
                break e;
            default:
                e = !1
        }
        if (e) return null;
        if (a && typeof a != "function") throw Error(u(231, t, typeof a));
        return a
    }

    var Pn = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"),
        ks = !1;
    if (Pn) try {
        var Tl = {};
        Object.defineProperty(Tl, "passive", {
            get: function () {
                ks = !0
            }
        }), window.addEventListener("test", Tl, Tl), window.removeEventListener("test", Tl, Tl)
    } catch {
        ks = !1
    }
    var ba = null, Hs = null, Br = null;

    function md() {
        if (Br) return Br;
        var e, t = Hs, a = t.length, l, s = "value" in ba ? ba.value : ba.textContent, c = s.length;
        for (e = 0; e < a && t[e] === s[e]; e++) ;
        var h = a - e;
        for (l = 1; l <= h && t[a - l] === s[c - l]; l++) ;
        return Br = s.slice(e, 1 < l ? 1 - l : void 0)
    }

    function kr(e) {
        var t = e.keyCode;
        return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0
    }

    function Hr() {
        return !0
    }

    function pd() {
        return !1
    }

    function Gt(e) {
        function t(a, l, s, c, h) {
            this._reactName = a, this._targetInst = s, this.type = l, this.nativeEvent = c, this.target = h, this.currentTarget = null;
            for (var g in e) e.hasOwnProperty(g) && (a = e[g], this[g] = a ? a(c) : c[g]);
            return this.isDefaultPrevented = (c.defaultPrevented != null ? c.defaultPrevented : c.returnValue === !1) ? Hr : pd, this.isPropagationStopped = pd, this
        }

        return S(t.prototype, {
            preventDefault: function () {
                this.defaultPrevented = !0;
                var a = this.nativeEvent;
                a && (a.preventDefault ? a.preventDefault() : typeof a.returnValue != "unknown" && (a.returnValue = !1), this.isDefaultPrevented = Hr)
            }, stopPropagation: function () {
                var a = this.nativeEvent;
                a && (a.stopPropagation ? a.stopPropagation() : typeof a.cancelBubble != "unknown" && (a.cancelBubble = !0), this.isPropagationStopped = Hr)
            }, persist: function () {
            }, isPersistent: Hr
        }), t
    }

    var Ka = {
            eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function (e) {
                return e.timeStamp || Date.now()
            }, defaultPrevented: 0, isTrusted: 0
        }, Vr = Gt(Ka), jl = S({}, Ka, {view: 0, detail: 0}), Bg = Gt(jl), Vs, $s, Al, $r = S({}, jl, {
            screenX: 0,
            screenY: 0,
            clientX: 0,
            clientY: 0,
            pageX: 0,
            pageY: 0,
            ctrlKey: 0,
            shiftKey: 0,
            altKey: 0,
            metaKey: 0,
            getModifierState: Ys,
            button: 0,
            buttons: 0,
            relatedTarget: function (e) {
                return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget
            },
            movementX: function (e) {
                return "movementX" in e ? e.movementX : (e !== Al && (Al && e.type === "mousemove" ? (Vs = e.screenX - Al.screenX, $s = e.screenY - Al.screenY) : $s = Vs = 0, Al = e), Vs)
            },
            movementY: function (e) {
                return "movementY" in e ? e.movementY : $s
            }
        }), yd = Gt($r), kg = S({}, $r, {dataTransfer: 0}), Hg = Gt(kg), Vg = S({}, jl, {relatedTarget: 0}), Qs = Gt(Vg),
        $g = S({}, Ka, {animationName: 0, elapsedTime: 0, pseudoElement: 0}), Qg = Gt($g), Yg = S({}, Ka, {
            clipboardData: function (e) {
                return "clipboardData" in e ? e.clipboardData : window.clipboardData
            }
        }), Gg = Gt(Yg), Fg = S({}, Ka, {data: 0}), vd = Gt(Fg), Xg = {
            Esc: "Escape",
            Spacebar: " ",
            Left: "ArrowLeft",
            Up: "ArrowUp",
            Right: "ArrowRight",
            Down: "ArrowDown",
            Del: "Delete",
            Win: "OS",
            Menu: "ContextMenu",
            Apps: "ContextMenu",
            Scroll: "ScrollLock",
            MozPrintableKey: "Unidentified"
        }, Jg = {
            8: "Backspace",
            9: "Tab",
            12: "Clear",
            13: "Enter",
            16: "Shift",
            17: "Control",
            18: "Alt",
            19: "Pause",
            20: "CapsLock",
            27: "Escape",
            32: " ",
            33: "PageUp",
            34: "PageDown",
            35: "End",
            36: "Home",
            37: "ArrowLeft",
            38: "ArrowUp",
            39: "ArrowRight",
            40: "ArrowDown",
            45: "Insert",
            46: "Delete",
            112: "F1",
            113: "F2",
            114: "F3",
            115: "F4",
            116: "F5",
            117: "F6",
            118: "F7",
            119: "F8",
            120: "F9",
            121: "F10",
            122: "F11",
            123: "F12",
            144: "NumLock",
            145: "ScrollLock",
            224: "Meta"
        }, Kg = {Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey"};

    function Pg(e) {
        var t = this.nativeEvent;
        return t.getModifierState ? t.getModifierState(e) : (e = Kg[e]) ? !!t[e] : !1
    }

    function Ys() {
        return Pg
    }

    var Ig = S({}, jl, {
            key: function (e) {
                if (e.key) {
                    var t = Xg[e.key] || e.key;
                    if (t !== "Unidentified") return t
                }
                return e.type === "keypress" ? (e = kr(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Jg[e.keyCode] || "Unidentified" : ""
            },
            code: 0,
            location: 0,
            ctrlKey: 0,
            shiftKey: 0,
            altKey: 0,
            metaKey: 0,
            repeat: 0,
            locale: 0,
            getModifierState: Ys,
            charCode: function (e) {
                return e.type === "keypress" ? kr(e) : 0
            },
            keyCode: function (e) {
                return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0
            },
            which: function (e) {
                return e.type === "keypress" ? kr(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0
            }
        }), Wg = Gt(Ig), eb = S({}, $r, {
            pointerId: 0,
            width: 0,
            height: 0,
            pressure: 0,
            tangentialPressure: 0,
            tiltX: 0,
            tiltY: 0,
            twist: 0,
            pointerType: 0,
            isPrimary: 0
        }), gd = Gt(eb), tb = S({}, jl, {
            touches: 0,
            targetTouches: 0,
            changedTouches: 0,
            altKey: 0,
            metaKey: 0,
            ctrlKey: 0,
            shiftKey: 0,
            getModifierState: Ys
        }), nb = Gt(tb), ab = S({}, Ka, {propertyName: 0, elapsedTime: 0, pseudoElement: 0}), ib = Gt(ab), lb = S({}, $r, {
            deltaX: function (e) {
                return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0
            }, deltaY: function (e) {
                return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0
            }, deltaZ: 0, deltaMode: 0
        }), rb = Gt(lb), ub = S({}, Ka, {newState: 0, oldState: 0}), sb = Gt(ub), ob = [9, 13, 27, 32],
        Gs = Pn && "CompositionEvent" in window, Rl = null;
    Pn && "documentMode" in document && (Rl = document.documentMode);
    var cb = Pn && "TextEvent" in window && !Rl, bd = Pn && (!Gs || Rl && 8 < Rl && 11 >= Rl), _d = " ", Sd = !1;

    function Ed(e, t) {
        switch (e) {
            case"keyup":
                return ob.indexOf(t.keyCode) !== -1;
            case"keydown":
                return t.keyCode !== 229;
            case"keypress":
            case"mousedown":
            case"focusout":
                return !0;
            default:
                return !1
        }
    }

    function xd(e) {
        return e = e.detail, typeof e == "object" && "data" in e ? e.data : null
    }

    var Di = !1;

    function fb(e, t) {
        switch (e) {
            case"compositionend":
                return xd(t);
            case"keypress":
                return t.which !== 32 ? null : (Sd = !0, _d);
            case"textInput":
                return e = t.data, e === _d && Sd ? null : e;
            default:
                return null
        }
    }

    function db(e, t) {
        if (Di) return e === "compositionend" || !Gs && Ed(e, t) ? (e = md(), Br = Hs = ba = null, Di = !1, e) : null;
        switch (e) {
            case"paste":
                return null;
            case"keypress":
                if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
                    if (t.char && 1 < t.char.length) return t.char;
                    if (t.which) return String.fromCharCode(t.which)
                }
                return null;
            case"compositionend":
                return bd && t.locale !== "ko" ? null : t.data;
            default:
                return null
        }
    }

    var hb = {
        color: !0,
        date: !0,
        datetime: !0,
        "datetime-local": !0,
        email: !0,
        month: !0,
        number: !0,
        password: !0,
        range: !0,
        search: !0,
        tel: !0,
        text: !0,
        time: !0,
        url: !0,
        week: !0
    };

    function zd(e) {
        var t = e && e.nodeName && e.nodeName.toLowerCase();
        return t === "input" ? !!hb[e.type] : t === "textarea"
    }

    function Od(e, t, a, l) {
        Ni ? Ci ? Ci.push(l) : Ci = [l] : Ni = l, t = Cu(t, "onChange"), 0 < t.length && (a = new Vr("onChange", "change", null, a, l), e.push({
            event: a,
            listeners: t
        }))
    }

    var wl = null, Nl = null;

    function mb(e) {
        up(e, 0)
    }

    function Qr(e) {
        var t = zl(e);
        if (rd(t)) return e
    }

    function Td(e, t) {
        if (e === "change") return t
    }

    var jd = !1;
    if (Pn) {
        var Fs;
        if (Pn) {
            var Xs = "oninput" in document;
            if (!Xs) {
                var Ad = document.createElement("div");
                Ad.setAttribute("oninput", "return;"), Xs = typeof Ad.oninput == "function"
            }
            Fs = Xs
        } else Fs = !1;
        jd = Fs && (!document.documentMode || 9 < document.documentMode)
    }

    function Rd() {
        wl && (wl.detachEvent("onpropertychange", wd), Nl = wl = null)
    }

    function wd(e) {
        if (e.propertyName === "value" && Qr(Nl)) {
            var t = [];
            Od(t, Nl, e, qs(e)), hd(mb, t)
        }
    }

    function pb(e, t, a) {
        e === "focusin" ? (Rd(), wl = t, Nl = a, wl.attachEvent("onpropertychange", wd)) : e === "focusout" && Rd()
    }

    function yb(e) {
        if (e === "selectionchange" || e === "keyup" || e === "keydown") return Qr(Nl)
    }

    function vb(e, t) {
        if (e === "click") return Qr(t)
    }

    function gb(e, t) {
        if (e === "input" || e === "change") return Qr(t)
    }

    function bb(e, t) {
        return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t
    }

    var en = typeof Object.is == "function" ? Object.is : bb;

    function Cl(e, t) {
        if (en(e, t)) return !0;
        if (typeof e != "object" || e === null || typeof t != "object" || t === null) return !1;
        var a = Object.keys(e), l = Object.keys(t);
        if (a.length !== l.length) return !1;
        for (l = 0; l < a.length; l++) {
            var s = a[l];
            if (!_l.call(t, s) || !en(e[s], t[s])) return !1
        }
        return !0
    }

    function Nd(e) {
        for (; e && e.firstChild;) e = e.firstChild;
        return e
    }

    function Cd(e, t) {
        var a = Nd(e);
        e = 0;
        for (var l; a;) {
            if (a.nodeType === 3) {
                if (l = e + a.textContent.length, e <= t && l >= t) return {node: a, offset: t - e};
                e = l
            }
            e:{
                for (; a;) {
                    if (a.nextSibling) {
                        a = a.nextSibling;
                        break e
                    }
                    a = a.parentNode
                }
                a = void 0
            }
            a = Nd(a)
        }
    }

    function Dd(e, t) {
        return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Dd(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1
    }

    function Md(e) {
        e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
        for (var t = Lr(e.document); t instanceof e.HTMLIFrameElement;) {
            try {
                var a = typeof t.contentWindow.location.href == "string"
            } catch {
                a = !1
            }
            if (a) e = t.contentWindow; else break;
            t = Lr(e.document)
        }
        return t
    }

    function Js(e) {
        var t = e && e.nodeName && e.nodeName.toLowerCase();
        return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true")
    }

    var _b = Pn && "documentMode" in document && 11 >= document.documentMode, Mi = null, Ks = null, Dl = null, Ps = !1;

    function Ud(e, t, a) {
        var l = a.window === a ? a.document : a.nodeType === 9 ? a : a.ownerDocument;
        Ps || Mi == null || Mi !== Lr(l) || (l = Mi, "selectionStart" in l && Js(l) ? l = {
            start: l.selectionStart,
            end: l.selectionEnd
        } : (l = (l.ownerDocument && l.ownerDocument.defaultView || window).getSelection(), l = {
            anchorNode: l.anchorNode,
            anchorOffset: l.anchorOffset,
            focusNode: l.focusNode,
            focusOffset: l.focusOffset
        }), Dl && Cl(Dl, l) || (Dl = l, l = Cu(Ks, "onSelect"), 0 < l.length && (t = new Vr("onSelect", "select", null, t, a), e.push({
            event: t,
            listeners: l
        }), t.target = Mi)))
    }

    function Pa(e, t) {
        var a = {};
        return a[e.toLowerCase()] = t.toLowerCase(), a["Webkit" + e] = "webkit" + t, a["Moz" + e] = "moz" + t, a
    }

    var Ui = {
        animationend: Pa("Animation", "AnimationEnd"),
        animationiteration: Pa("Animation", "AnimationIteration"),
        animationstart: Pa("Animation", "AnimationStart"),
        transitionrun: Pa("Transition", "TransitionRun"),
        transitionstart: Pa("Transition", "TransitionStart"),
        transitioncancel: Pa("Transition", "TransitionCancel"),
        transitionend: Pa("Transition", "TransitionEnd")
    }, Is = {}, Zd = {};
    Pn && (Zd = document.createElement("div").style, "AnimationEvent" in window || (delete Ui.animationend.animation, delete Ui.animationiteration.animation, delete Ui.animationstart.animation), "TransitionEvent" in window || delete Ui.transitionend.transition);

    function Ia(e) {
        if (Is[e]) return Is[e];
        if (!Ui[e]) return e;
        var t = Ui[e], a;
        for (a in t) if (t.hasOwnProperty(a) && a in Zd) return Is[e] = t[a];
        return e
    }

    var Ld = Ia("animationend"), qd = Ia("animationiteration"), Bd = Ia("animationstart"), Sb = Ia("transitionrun"),
        Eb = Ia("transitionstart"), xb = Ia("transitioncancel"), kd = Ia("transitionend"), Hd = new Map,
        Ws = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
    Ws.push("scrollEnd");

    function wn(e, t) {
        Hd.set(e, t), Ja(t, [e])
    }

    var Yr = typeof reportError == "function" ? reportError : function (e) {
        if (typeof window == "object" && typeof window.ErrorEvent == "function") {
            var t = new window.ErrorEvent("error", {
                bubbles: !0,
                cancelable: !0,
                message: typeof e == "object" && e !== null && typeof e.message == "string" ? String(e.message) : String(e),
                error: e
            });
            if (!window.dispatchEvent(t)) return
        } else if (typeof process == "object" && typeof process.emit == "function") {
            process.emit("uncaughtException", e);
            return
        }
        console.error(e)
    }, yn = [], Zi = 0, eo = 0;

    function Gr() {
        for (var e = Zi, t = eo = Zi = 0; t < e;) {
            var a = yn[t];
            yn[t++] = null;
            var l = yn[t];
            yn[t++] = null;
            var s = yn[t];
            yn[t++] = null;
            var c = yn[t];
            if (yn[t++] = null, l !== null && s !== null) {
                var h = l.pending;
                h === null ? s.next = s : (s.next = h.next, h.next = s), l.pending = s
            }
            c !== 0 && Vd(a, s, c)
        }
    }

    function Fr(e, t, a, l) {
        yn[Zi++] = e, yn[Zi++] = t, yn[Zi++] = a, yn[Zi++] = l, eo |= l, e.lanes |= l, e = e.alternate, e !== null && (e.lanes |= l)
    }

    function to(e, t, a, l) {
        return Fr(e, t, a, l), Xr(e)
    }

    function Wa(e, t) {
        return Fr(e, null, null, t), Xr(e)
    }

    function Vd(e, t, a) {
        e.lanes |= a;
        var l = e.alternate;
        l !== null && (l.lanes |= a);
        for (var s = !1, c = e.return; c !== null;) c.childLanes |= a, l = c.alternate, l !== null && (l.childLanes |= a), c.tag === 22 && (e = c.stateNode, e === null || e._visibility & 1 || (s = !0)), e = c, c = c.return;
        return e.tag === 3 ? (c = e.stateNode, s && t !== null && (s = 31 - Ze(a), e = c.hiddenUpdates, l = e[s], l === null ? e[s] = [t] : l.push(t), t.lane = a | 536870912), c) : null
    }

    function Xr(e) {
        if (50 < tr) throw tr = 0, fc = null, Error(u(185));
        for (var t = e.return; t !== null;) e = t, t = e.return;
        return e.tag === 3 ? e.stateNode : null
    }

    var Li = {};

    function zb(e, t, a, l) {
        this.tag = e, this.key = a, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = l, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null
    }

    function tn(e, t, a, l) {
        return new zb(e, t, a, l)
    }

    function no(e) {
        return e = e.prototype, !(!e || !e.isReactComponent)
    }

    function In(e, t) {
        var a = e.alternate;
        return a === null ? (a = tn(e.tag, t, e.key, e.mode), a.elementType = e.elementType, a.type = e.type, a.stateNode = e.stateNode, a.alternate = e, e.alternate = a) : (a.pendingProps = t, a.type = e.type, a.flags = 0, a.subtreeFlags = 0, a.deletions = null), a.flags = e.flags & 65011712, a.childLanes = e.childLanes, a.lanes = e.lanes, a.child = e.child, a.memoizedProps = e.memoizedProps, a.memoizedState = e.memoizedState, a.updateQueue = e.updateQueue, t = e.dependencies, a.dependencies = t === null ? null : {
            lanes: t.lanes,
            firstContext: t.firstContext
        }, a.sibling = e.sibling, a.index = e.index, a.ref = e.ref, a.refCleanup = e.refCleanup, a
    }

    function $d(e, t) {
        e.flags &= 65011714;
        var a = e.alternate;
        return a === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = a.childLanes, e.lanes = a.lanes, e.child = a.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = a.memoizedProps, e.memoizedState = a.memoizedState, e.updateQueue = a.updateQueue, e.type = a.type, t = a.dependencies, e.dependencies = t === null ? null : {
            lanes: t.lanes,
            firstContext: t.firstContext
        }), e
    }

    function Jr(e, t, a, l, s, c) {
        var h = 0;
        if (l = e, typeof e == "function") no(e) && (h = 1); else if (typeof e == "string") h = R0(e, a, F.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5; else e:switch (e) {
            case qe:
                return e = tn(31, a, t, s), e.elementType = qe, e.lanes = c, e;
            case V:
                return ei(a.children, s, c, t);
            case U:
                h = 8, s |= 24;
                break;
            case J:
                return e = tn(12, a, t, s | 2), e.elementType = J, e.lanes = c, e;
            case te:
                return e = tn(13, a, t, s), e.elementType = te, e.lanes = c, e;
            case Te:
                return e = tn(19, a, t, s), e.elementType = Te, e.lanes = c, e;
            default:
                if (typeof e == "object" && e !== null) switch (e.$$typeof) {
                    case W:
                        h = 10;
                        break e;
                    case G:
                        h = 9;
                        break e;
                    case Y:
                        h = 11;
                        break e;
                    case le:
                        h = 14;
                        break e;
                    case be:
                        h = 16, l = null;
                        break e
                }
                h = 29, a = Error(u(130, e === null ? "null" : typeof e, "")), l = null
        }
        return t = tn(h, a, t, s), t.elementType = e, t.type = l, t.lanes = c, t
    }

    function ei(e, t, a, l) {
        return e = tn(7, e, l, t), e.lanes = a, e
    }

    function ao(e, t, a) {
        return e = tn(6, e, null, t), e.lanes = a, e
    }

    function Qd(e) {
        var t = tn(18, null, null, 0);
        return t.stateNode = e, t
    }

    function io(e, t, a) {
        return t = tn(4, e.children !== null ? e.children : [], e.key, t), t.lanes = a, t.stateNode = {
            containerInfo: e.containerInfo,
            pendingChildren: null,
            implementation: e.implementation
        }, t
    }

    var Yd = new WeakMap;

    function vn(e, t) {
        if (typeof e == "object" && e !== null) {
            var a = Yd.get(e);
            return a !== void 0 ? a : (t = {value: e, source: t, stack: bl(t)}, Yd.set(e, t), t)
        }
        return {value: e, source: t, stack: bl(t)}
    }

    var qi = [], Bi = 0, Kr = null, Ml = 0, gn = [], bn = 0, _a = null, kn = 1, Hn = "";

    function Wn(e, t) {
        qi[Bi++] = Ml, qi[Bi++] = Kr, Kr = e, Ml = t
    }

    function Gd(e, t, a) {
        gn[bn++] = kn, gn[bn++] = Hn, gn[bn++] = _a, _a = e;
        var l = kn;
        e = Hn;
        var s = 32 - Ze(l) - 1;
        l &= ~(1 << s), a += 1;
        var c = 32 - Ze(t) + s;
        if (30 < c) {
            var h = s - s % 5;
            c = (l & (1 << h) - 1).toString(32), l >>= h, s -= h, kn = 1 << 32 - Ze(t) + s | a << s | l, Hn = c + e
        } else kn = 1 << c | a << s | l, Hn = e
    }

    function lo(e) {
        e.return !== null && (Wn(e, 1), Gd(e, 1, 0))
    }

    function ro(e) {
        for (; e === Kr;) Kr = qi[--Bi], qi[Bi] = null, Ml = qi[--Bi], qi[Bi] = null;
        for (; e === _a;) _a = gn[--bn], gn[bn] = null, Hn = gn[--bn], gn[bn] = null, kn = gn[--bn], gn[bn] = null
    }

    function Fd(e, t) {
        gn[bn++] = kn, gn[bn++] = Hn, gn[bn++] = _a, kn = t.id, Hn = t.overflow, _a = e
    }

    var Rt = null, We = null, Me = !1, Sa = null, _n = !1, uo = Error(u(519));

    function Ea(e) {
        var t = Error(u(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", ""));
        throw Ul(vn(t, e)), uo
    }

    function Xd(e) {
        var t = e.stateNode, a = e.type, l = e.memoizedProps;
        switch (t[At] = e, t[Yt] = l, a) {
            case"dialog":
                Ne("cancel", t), Ne("close", t);
                break;
            case"iframe":
            case"object":
            case"embed":
                Ne("load", t);
                break;
            case"video":
            case"audio":
                for (a = 0; a < ar.length; a++) Ne(ar[a], t);
                break;
            case"source":
                Ne("error", t);
                break;
            case"img":
            case"image":
            case"link":
                Ne("error", t), Ne("load", t);
                break;
            case"details":
                Ne("toggle", t);
                break;
            case"input":
                Ne("invalid", t), ud(t, l.value, l.defaultValue, l.checked, l.defaultChecked, l.type, l.name, !0);
                break;
            case"select":
                Ne("invalid", t);
                break;
            case"textarea":
                Ne("invalid", t), od(t, l.value, l.defaultValue, l.children)
        }
        a = l.children, typeof a != "string" && typeof a != "number" && typeof a != "bigint" || t.textContent === "" + a || l.suppressHydrationWarning === !0 || fp(t.textContent, a) ? (l.popover != null && (Ne("beforetoggle", t), Ne("toggle", t)), l.onScroll != null && Ne("scroll", t), l.onScrollEnd != null && Ne("scrollend", t), l.onClick != null && (t.onclick = Kn), t = !0) : t = !1, t || Ea(e, !0)
    }

    function Jd(e) {
        for (Rt = e.return; Rt;) switch (Rt.tag) {
            case 5:
            case 31:
            case 13:
                _n = !1;
                return;
            case 27:
            case 3:
                _n = !0;
                return;
            default:
                Rt = Rt.return
        }
    }

    function ki(e) {
        if (e !== Rt) return !1;
        if (!Me) return Jd(e), Me = !0, !1;
        var t = e.tag, a;
        if ((a = t !== 3 && t !== 27) && ((a = t === 5) && (a = e.type, a = !(a !== "form" && a !== "button") || Tc(e.type, e.memoizedProps)), a = !a), a && We && Ea(e), Jd(e), t === 13) {
            if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(u(317));
            We = _p(e)
        } else if (t === 31) {
            if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(u(317));
            We = _p(e)
        } else t === 27 ? (t = We, Za(e.type) ? (e = Nc, Nc = null, We = e) : We = t) : We = Rt ? En(e.stateNode.nextSibling) : null;
        return !0
    }

    function ti() {
        We = Rt = null, Me = !1
    }

    function so() {
        var e = Sa;
        return e !== null && (Kt === null ? Kt = e : Kt.push.apply(Kt, e), Sa = null), e
    }

    function Ul(e) {
        Sa === null ? Sa = [e] : Sa.push(e)
    }

    var oo = x(null), ni = null, ea = null;

    function xa(e, t, a) {
        I(oo, t._currentValue), t._currentValue = a
    }

    function ta(e) {
        e._currentValue = oo.current, k(oo)
    }

    function co(e, t, a) {
        for (; e !== null;) {
            var l = e.alternate;
            if ((e.childLanes & t) !== t ? (e.childLanes |= t, l !== null && (l.childLanes |= t)) : l !== null && (l.childLanes & t) !== t && (l.childLanes |= t), e === a) break;
            e = e.return
        }
    }

    function fo(e, t, a, l) {
        var s = e.child;
        for (s !== null && (s.return = e); s !== null;) {
            var c = s.dependencies;
            if (c !== null) {
                var h = s.child;
                c = c.firstContext;
                e:for (; c !== null;) {
                    var g = c;
                    c = s;
                    for (var E = 0; E < t.length; E++) if (g.context === t[E]) {
                        c.lanes |= a, g = c.alternate, g !== null && (g.lanes |= a), co(c.return, a, e), l || (h = null);
                        break e
                    }
                    c = g.next
                }
            } else if (s.tag === 18) {
                if (h = s.return, h === null) throw Error(u(341));
                h.lanes |= a, c = h.alternate, c !== null && (c.lanes |= a), co(h, a, e), h = null
            } else h = s.child;
            if (h !== null) h.return = s; else for (h = s; h !== null;) {
                if (h === e) {
                    h = null;
                    break
                }
                if (s = h.sibling, s !== null) {
                    s.return = h.return, h = s;
                    break
                }
                h = h.return
            }
            s = h
        }
    }

    function Hi(e, t, a, l) {
        e = null;
        for (var s = t, c = !1; s !== null;) {
            if (!c) {
                if ((s.flags & 524288) !== 0) c = !0; else if ((s.flags & 262144) !== 0) break
            }
            if (s.tag === 10) {
                var h = s.alternate;
                if (h === null) throw Error(u(387));
                if (h = h.memoizedProps, h !== null) {
                    var g = s.type;
                    en(s.pendingProps.value, h.value) || (e !== null ? e.push(g) : e = [g])
                }
            } else if (s === Re.current) {
                if (h = s.alternate, h === null) throw Error(u(387));
                h.memoizedState.memoizedState !== s.memoizedState.memoizedState && (e !== null ? e.push(sr) : e = [sr])
            }
            s = s.return
        }
        e !== null && fo(t, e, a, l), t.flags |= 262144
    }

    function Pr(e) {
        for (e = e.firstContext; e !== null;) {
            if (!en(e.context._currentValue, e.memoizedValue)) return !0;
            e = e.next
        }
        return !1
    }

    function ai(e) {
        ni = e, ea = null, e = e.dependencies, e !== null && (e.firstContext = null)
    }

    function wt(e) {
        return Kd(ni, e)
    }

    function Ir(e, t) {
        return ni === null && ai(e), Kd(e, t)
    }

    function Kd(e, t) {
        var a = t._currentValue;
        if (t = {context: t, memoizedValue: a, next: null}, ea === null) {
            if (e === null) throw Error(u(308));
            ea = t, e.dependencies = {lanes: 0, firstContext: t}, e.flags |= 524288
        } else ea = ea.next = t;
        return a
    }

    var Ob = typeof AbortController < "u" ? AbortController : function () {
            var e = [], t = this.signal = {
                aborted: !1, addEventListener: function (a, l) {
                    e.push(l)
                }
            };
            this.abort = function () {
                t.aborted = !0, e.forEach(function (a) {
                    return a()
                })
            }
        }, Tb = n.unstable_scheduleCallback, jb = n.unstable_NormalPriority,
        yt = {$$typeof: W, Consumer: null, Provider: null, _currentValue: null, _currentValue2: null, _threadCount: 0};

    function ho() {
        return {controller: new Ob, data: new Map, refCount: 0}
    }

    function Zl(e) {
        e.refCount--, e.refCount === 0 && Tb(jb, function () {
            e.controller.abort()
        })
    }

    var Ll = null, mo = 0, Vi = 0, $i = null;

    function Ab(e, t) {
        if (Ll === null) {
            var a = Ll = [];
            mo = 0, Vi = vc(), $i = {
                status: "pending", value: void 0, then: function (l) {
                    a.push(l)
                }
            }
        }
        return mo++, t.then(Pd, Pd), t
    }

    function Pd() {
        if (--mo === 0 && Ll !== null) {
            $i !== null && ($i.status = "fulfilled");
            var e = Ll;
            Ll = null, Vi = 0, $i = null;
            for (var t = 0; t < e.length; t++) (0, e[t])()
        }
    }

    function Rb(e, t) {
        var a = [], l = {
            status: "pending", value: null, reason: null, then: function (s) {
                a.push(s)
            }
        };
        return e.then(function () {
            l.status = "fulfilled", l.value = t;
            for (var s = 0; s < a.length; s++) (0, a[s])(t)
        }, function (s) {
            for (l.status = "rejected", l.reason = s, s = 0; s < a.length; s++) (0, a[s])(void 0)
        }), l
    }

    var Id = Z.S;
    Z.S = function (e, t) {
        Um = $t(), typeof t == "object" && t !== null && typeof t.then == "function" && Ab(e, t), Id !== null && Id(e, t)
    };
    var ii = x(null);

    function po() {
        var e = ii.current;
        return e !== null ? e : Ke.pooledCache
    }

    function Wr(e, t) {
        t === null ? I(ii, ii.current) : I(ii, t.pool)
    }

    function Wd() {
        var e = po();
        return e === null ? null : {parent: yt._currentValue, pool: e}
    }

    var Qi = Error(u(460)), yo = Error(u(474)), eu = Error(u(542)), tu = {
        then: function () {
        }
    };

    function eh(e) {
        return e = e.status, e === "fulfilled" || e === "rejected"
    }

    function th(e, t, a) {
        switch (a = e[a], a === void 0 ? e.push(t) : a !== t && (t.then(Kn, Kn), t = a), t.status) {
            case"fulfilled":
                return t.value;
            case"rejected":
                throw e = t.reason, ah(e), e;
            default:
                if (typeof t.status == "string") t.then(Kn, Kn); else {
                    if (e = Ke, e !== null && 100 < e.shellSuspendCounter) throw Error(u(482));
                    e = t, e.status = "pending", e.then(function (l) {
                        if (t.status === "pending") {
                            var s = t;
                            s.status = "fulfilled", s.value = l
                        }
                    }, function (l) {
                        if (t.status === "pending") {
                            var s = t;
                            s.status = "rejected", s.reason = l
                        }
                    })
                }
                switch (t.status) {
                    case"fulfilled":
                        return t.value;
                    case"rejected":
                        throw e = t.reason, ah(e), e
                }
                throw ri = t, Qi
        }
    }

    function li(e) {
        try {
            var t = e._init;
            return t(e._payload)
        } catch (a) {
            throw a !== null && typeof a == "object" && typeof a.then == "function" ? (ri = a, Qi) : a
        }
    }

    var ri = null;

    function nh() {
        if (ri === null) throw Error(u(459));
        var e = ri;
        return ri = null, e
    }

    function ah(e) {
        if (e === Qi || e === eu) throw Error(u(483))
    }

    var Yi = null, ql = 0;

    function nu(e) {
        var t = ql;
        return ql += 1, Yi === null && (Yi = []), th(Yi, e, t)
    }

    function Bl(e, t) {
        t = t.props.ref, e.ref = t !== void 0 ? t : null
    }

    function au(e, t) {
        throw t.$$typeof === T ? Error(u(525)) : (e = Object.prototype.toString.call(t), Error(u(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)))
    }

    function ih(e) {
        function t(A, O) {
            if (e) {
                var N = A.deletions;
                N === null ? (A.deletions = [O], A.flags |= 16) : N.push(O)
            }
        }

        function a(A, O) {
            if (!e) return null;
            for (; O !== null;) t(A, O), O = O.sibling;
            return null
        }

        function l(A) {
            for (var O = new Map; A !== null;) A.key !== null ? O.set(A.key, A) : O.set(A.index, A), A = A.sibling;
            return O
        }

        function s(A, O) {
            return A = In(A, O), A.index = 0, A.sibling = null, A
        }

        function c(A, O, N) {
            return A.index = N, e ? (N = A.alternate, N !== null ? (N = N.index, N < O ? (A.flags |= 67108866, O) : N) : (A.flags |= 67108866, O)) : (A.flags |= 1048576, O)
        }

        function h(A) {
            return e && A.alternate === null && (A.flags |= 67108866), A
        }

        function g(A, O, N, H) {
            return O === null || O.tag !== 6 ? (O = ao(N, A.mode, H), O.return = A, O) : (O = s(O, N), O.return = A, O)
        }

        function E(A, O, N, H) {
            var he = N.type;
            return he === V ? B(A, O, N.props.children, H, N.key) : O !== null && (O.elementType === he || typeof he == "object" && he !== null && he.$$typeof === be && li(he) === O.type) ? (O = s(O, N.props), Bl(O, N), O.return = A, O) : (O = Jr(N.type, N.key, N.props, null, A.mode, H), Bl(O, N), O.return = A, O)
        }

        function C(A, O, N, H) {
            return O === null || O.tag !== 4 || O.stateNode.containerInfo !== N.containerInfo || O.stateNode.implementation !== N.implementation ? (O = io(N, A.mode, H), O.return = A, O) : (O = s(O, N.children || []), O.return = A, O)
        }

        function B(A, O, N, H, he) {
            return O === null || O.tag !== 7 ? (O = ei(N, A.mode, H, he), O.return = A, O) : (O = s(O, N), O.return = A, O)
        }

        function Q(A, O, N) {
            if (typeof O == "string" && O !== "" || typeof O == "number" || typeof O == "bigint") return O = ao("" + O, A.mode, N), O.return = A, O;
            if (typeof O == "object" && O !== null) {
                switch (O.$$typeof) {
                    case R:
                        return N = Jr(O.type, O.key, O.props, null, A.mode, N), Bl(N, O), N.return = A, N;
                    case q:
                        return O = io(O, A.mode, N), O.return = A, O;
                    case be:
                        return O = li(O), Q(A, O, N)
                }
                if (ge(O) || fe(O)) return O = ei(O, A.mode, N, null), O.return = A, O;
                if (typeof O.then == "function") return Q(A, nu(O), N);
                if (O.$$typeof === W) return Q(A, Ir(A, O), N);
                au(A, O)
            }
            return null
        }

        function M(A, O, N, H) {
            var he = O !== null ? O.key : null;
            if (typeof N == "string" && N !== "" || typeof N == "number" || typeof N == "bigint") return he !== null ? null : g(A, O, "" + N, H);
            if (typeof N == "object" && N !== null) {
                switch (N.$$typeof) {
                    case R:
                        return N.key === he ? E(A, O, N, H) : null;
                    case q:
                        return N.key === he ? C(A, O, N, H) : null;
                    case be:
                        return N = li(N), M(A, O, N, H)
                }
                if (ge(N) || fe(N)) return he !== null ? null : B(A, O, N, H, null);
                if (typeof N.then == "function") return M(A, O, nu(N), H);
                if (N.$$typeof === W) return M(A, O, Ir(A, N), H);
                au(A, N)
            }
            return null
        }

        function L(A, O, N, H, he) {
            if (typeof H == "string" && H !== "" || typeof H == "number" || typeof H == "bigint") return A = A.get(N) || null, g(O, A, "" + H, he);
            if (typeof H == "object" && H !== null) {
                switch (H.$$typeof) {
                    case R:
                        return A = A.get(H.key === null ? N : H.key) || null, E(O, A, H, he);
                    case q:
                        return A = A.get(H.key === null ? N : H.key) || null, C(O, A, H, he);
                    case be:
                        return H = li(H), L(A, O, N, H, he)
                }
                if (ge(H) || fe(H)) return A = A.get(N) || null, B(O, A, H, he, null);
                if (typeof H.then == "function") return L(A, O, N, nu(H), he);
                if (H.$$typeof === W) return L(A, O, N, Ir(O, H), he);
                au(O, H)
            }
            return null
        }

        function re(A, O, N, H) {
            for (var he = null, Be = null, oe = O, Oe = O = 0, De = null; oe !== null && Oe < N.length; Oe++) {
                oe.index > Oe ? (De = oe, oe = null) : De = oe.sibling;
                var ke = M(A, oe, N[Oe], H);
                if (ke === null) {
                    oe === null && (oe = De);
                    break
                }
                e && oe && ke.alternate === null && t(A, oe), O = c(ke, O, Oe), Be === null ? he = ke : Be.sibling = ke, Be = ke, oe = De
            }
            if (Oe === N.length) return a(A, oe), Me && Wn(A, Oe), he;
            if (oe === null) {
                for (; Oe < N.length; Oe++) oe = Q(A, N[Oe], H), oe !== null && (O = c(oe, O, Oe), Be === null ? he = oe : Be.sibling = oe, Be = oe);
                return Me && Wn(A, Oe), he
            }
            for (oe = l(oe); Oe < N.length; Oe++) De = L(oe, A, Oe, N[Oe], H), De !== null && (e && De.alternate !== null && oe.delete(De.key === null ? Oe : De.key), O = c(De, O, Oe), Be === null ? he = De : Be.sibling = De, Be = De);
            return e && oe.forEach(function (Ha) {
                return t(A, Ha)
            }), Me && Wn(A, Oe), he
        }

        function ve(A, O, N, H) {
            if (N == null) throw Error(u(151));
            for (var he = null, Be = null, oe = O, Oe = O = 0, De = null, ke = N.next(); oe !== null && !ke.done; Oe++, ke = N.next()) {
                oe.index > Oe ? (De = oe, oe = null) : De = oe.sibling;
                var Ha = M(A, oe, ke.value, H);
                if (Ha === null) {
                    oe === null && (oe = De);
                    break
                }
                e && oe && Ha.alternate === null && t(A, oe), O = c(Ha, O, Oe), Be === null ? he = Ha : Be.sibling = Ha, Be = Ha, oe = De
            }
            if (ke.done) return a(A, oe), Me && Wn(A, Oe), he;
            if (oe === null) {
                for (; !ke.done; Oe++, ke = N.next()) ke = Q(A, ke.value, H), ke !== null && (O = c(ke, O, Oe), Be === null ? he = ke : Be.sibling = ke, Be = ke);
                return Me && Wn(A, Oe), he
            }
            for (oe = l(oe); !ke.done; Oe++, ke = N.next()) ke = L(oe, A, Oe, ke.value, H), ke !== null && (e && ke.alternate !== null && oe.delete(ke.key === null ? Oe : ke.key), O = c(ke, O, Oe), Be === null ? he = ke : Be.sibling = ke, Be = ke);
            return e && oe.forEach(function (k0) {
                return t(A, k0)
            }), Me && Wn(A, Oe), he
        }

        function Fe(A, O, N, H) {
            if (typeof N == "object" && N !== null && N.type === V && N.key === null && (N = N.props.children), typeof N == "object" && N !== null) {
                switch (N.$$typeof) {
                    case R:
                        e:{
                            for (var he = N.key; O !== null;) {
                                if (O.key === he) {
                                    if (he = N.type, he === V) {
                                        if (O.tag === 7) {
                                            a(A, O.sibling), H = s(O, N.props.children), H.return = A, A = H;
                                            break e
                                        }
                                    } else if (O.elementType === he || typeof he == "object" && he !== null && he.$$typeof === be && li(he) === O.type) {
                                        a(A, O.sibling), H = s(O, N.props), Bl(H, N), H.return = A, A = H;
                                        break e
                                    }
                                    a(A, O);
                                    break
                                } else t(A, O);
                                O = O.sibling
                            }
                            N.type === V ? (H = ei(N.props.children, A.mode, H, N.key), H.return = A, A = H) : (H = Jr(N.type, N.key, N.props, null, A.mode, H), Bl(H, N), H.return = A, A = H)
                        }
                        return h(A);
                    case q:
                        e:{
                            for (he = N.key; O !== null;) {
                                if (O.key === he) if (O.tag === 4 && O.stateNode.containerInfo === N.containerInfo && O.stateNode.implementation === N.implementation) {
                                    a(A, O.sibling), H = s(O, N.children || []), H.return = A, A = H;
                                    break e
                                } else {
                                    a(A, O);
                                    break
                                } else t(A, O);
                                O = O.sibling
                            }
                            H = io(N, A.mode, H), H.return = A, A = H
                        }
                        return h(A);
                    case be:
                        return N = li(N), Fe(A, O, N, H)
                }
                if (ge(N)) return re(A, O, N, H);
                if (fe(N)) {
                    if (he = fe(N), typeof he != "function") throw Error(u(150));
                    return N = he.call(N), ve(A, O, N, H)
                }
                if (typeof N.then == "function") return Fe(A, O, nu(N), H);
                if (N.$$typeof === W) return Fe(A, O, Ir(A, N), H);
                au(A, N)
            }
            return typeof N == "string" && N !== "" || typeof N == "number" || typeof N == "bigint" ? (N = "" + N, O !== null && O.tag === 6 ? (a(A, O.sibling), H = s(O, N), H.return = A, A = H) : (a(A, O), H = ao(N, A.mode, H), H.return = A, A = H), h(A)) : a(A, O)
        }

        return function (A, O, N, H) {
            try {
                ql = 0;
                var he = Fe(A, O, N, H);
                return Yi = null, he
            } catch (oe) {
                if (oe === Qi || oe === eu) throw oe;
                var Be = tn(29, oe, null, A.mode);
                return Be.lanes = H, Be.return = A, Be
            }
        }
    }

    var ui = ih(!0), lh = ih(!1), za = !1;

    function vo(e) {
        e.updateQueue = {
            baseState: e.memoizedState,
            firstBaseUpdate: null,
            lastBaseUpdate: null,
            shared: {pending: null, lanes: 0, hiddenCallbacks: null},
            callbacks: null
        }
    }

    function go(e, t) {
        e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
            baseState: e.baseState,
            firstBaseUpdate: e.firstBaseUpdate,
            lastBaseUpdate: e.lastBaseUpdate,
            shared: e.shared,
            callbacks: null
        })
    }

    function Oa(e) {
        return {lane: e, tag: 0, payload: null, callback: null, next: null}
    }

    function Ta(e, t, a) {
        var l = e.updateQueue;
        if (l === null) return null;
        if (l = l.shared, (Ve & 2) !== 0) {
            var s = l.pending;
            return s === null ? t.next = t : (t.next = s.next, s.next = t), l.pending = t, t = Xr(e), Vd(e, null, a), t
        }
        return Fr(e, l, t, a), Xr(e)
    }

    function kl(e, t, a) {
        if (t = t.updateQueue, t !== null && (t = t.shared, (a & 4194048) !== 0)) {
            var l = t.lanes;
            l &= e.pendingLanes, a |= l, t.lanes = a, Kf(e, a)
        }
    }

    function bo(e, t) {
        var a = e.updateQueue, l = e.alternate;
        if (l !== null && (l = l.updateQueue, a === l)) {
            var s = null, c = null;
            if (a = a.firstBaseUpdate, a !== null) {
                do {
                    var h = {lane: a.lane, tag: a.tag, payload: a.payload, callback: null, next: null};
                    c === null ? s = c = h : c = c.next = h, a = a.next
                } while (a !== null);
                c === null ? s = c = t : c = c.next = t
            } else s = c = t;
            a = {
                baseState: l.baseState,
                firstBaseUpdate: s,
                lastBaseUpdate: c,
                shared: l.shared,
                callbacks: l.callbacks
            }, e.updateQueue = a;
            return
        }
        e = a.lastBaseUpdate, e === null ? a.firstBaseUpdate = t : e.next = t, a.lastBaseUpdate = t
    }

    var _o = !1;

    function Hl() {
        if (_o) {
            var e = $i;
            if (e !== null) throw e
        }
    }

    function Vl(e, t, a, l) {
        _o = !1;
        var s = e.updateQueue;
        za = !1;
        var c = s.firstBaseUpdate, h = s.lastBaseUpdate, g = s.shared.pending;
        if (g !== null) {
            s.shared.pending = null;
            var E = g, C = E.next;
            E.next = null, h === null ? c = C : h.next = C, h = E;
            var B = e.alternate;
            B !== null && (B = B.updateQueue, g = B.lastBaseUpdate, g !== h && (g === null ? B.firstBaseUpdate = C : g.next = C, B.lastBaseUpdate = E))
        }
        if (c !== null) {
            var Q = s.baseState;
            h = 0, B = C = E = null, g = c;
            do {
                var M = g.lane & -536870913, L = M !== g.lane;
                if (L ? (Ce & M) === M : (l & M) === M) {
                    M !== 0 && M === Vi && (_o = !0), B !== null && (B = B.next = {
                        lane: 0,
                        tag: g.tag,
                        payload: g.payload,
                        callback: null,
                        next: null
                    });
                    e:{
                        var re = e, ve = g;
                        M = t;
                        var Fe = a;
                        switch (ve.tag) {
                            case 1:
                                if (re = ve.payload, typeof re == "function") {
                                    Q = re.call(Fe, Q, M);
                                    break e
                                }
                                Q = re;
                                break e;
                            case 3:
                                re.flags = re.flags & -65537 | 128;
                            case 0:
                                if (re = ve.payload, M = typeof re == "function" ? re.call(Fe, Q, M) : re, M == null) break e;
                                Q = S({}, Q, M);
                                break e;
                            case 2:
                                za = !0
                        }
                    }
                    M = g.callback, M !== null && (e.flags |= 64, L && (e.flags |= 8192), L = s.callbacks, L === null ? s.callbacks = [M] : L.push(M))
                } else L = {
                    lane: M,
                    tag: g.tag,
                    payload: g.payload,
                    callback: g.callback,
                    next: null
                }, B === null ? (C = B = L, E = Q) : B = B.next = L, h |= M;
                if (g = g.next, g === null) {
                    if (g = s.shared.pending, g === null) break;
                    L = g, g = L.next, L.next = null, s.lastBaseUpdate = L, s.shared.pending = null
                }
            } while (!0);
            B === null && (E = Q), s.baseState = E, s.firstBaseUpdate = C, s.lastBaseUpdate = B, c === null && (s.shared.lanes = 0), Na |= h, e.lanes = h, e.memoizedState = Q
        }
    }

    function rh(e, t) {
        if (typeof e != "function") throw Error(u(191, e));
        e.call(t)
    }

    function uh(e, t) {
        var a = e.callbacks;
        if (a !== null) for (e.callbacks = null, e = 0; e < a.length; e++) rh(a[e], t)
    }

    var Gi = x(null), iu = x(0);

    function sh(e, t) {
        e = ca, I(iu, e), I(Gi, t), ca = e | t.baseLanes
    }

    function So() {
        I(iu, ca), I(Gi, Gi.current)
    }

    function Eo() {
        ca = iu.current, k(Gi), k(iu)
    }

    var nn = x(null), Sn = null;

    function ja(e) {
        var t = e.alternate;
        I(ht, ht.current & 1), I(nn, e), Sn === null && (t === null || Gi.current !== null || t.memoizedState !== null) && (Sn = e)
    }

    function xo(e) {
        I(ht, ht.current), I(nn, e), Sn === null && (Sn = e)
    }

    function oh(e) {
        e.tag === 22 ? (I(ht, ht.current), I(nn, e), Sn === null && (Sn = e)) : Aa()
    }

    function Aa() {
        I(ht, ht.current), I(nn, nn.current)
    }

    function an(e) {
        k(nn), Sn === e && (Sn = null), k(ht)
    }

    var ht = x(0);

    function lu(e) {
        for (var t = e; t !== null;) {
            if (t.tag === 13) {
                var a = t.memoizedState;
                if (a !== null && (a = a.dehydrated, a === null || Rc(a) || wc(a))) return t
            } else if (t.tag === 19 && (t.memoizedProps.revealOrder === "forwards" || t.memoizedProps.revealOrder === "backwards" || t.memoizedProps.revealOrder === "unstable_legacy-backwards" || t.memoizedProps.revealOrder === "together")) {
                if ((t.flags & 128) !== 0) return t
            } else if (t.child !== null) {
                t.child.return = t, t = t.child;
                continue
            }
            if (t === e) break;
            for (; t.sibling === null;) {
                if (t.return === null || t.return === e) return null;
                t = t.return
            }
            t.sibling.return = t.return, t = t.sibling
        }
        return null
    }

    var na = 0, ze = null, Ye = null, vt = null, ru = !1, Fi = !1, si = !1, uu = 0, $l = 0, Xi = null, wb = 0;

    function ot() {
        throw Error(u(321))
    }

    function zo(e, t) {
        if (t === null) return !1;
        for (var a = 0; a < t.length && a < e.length; a++) if (!en(e[a], t[a])) return !1;
        return !0
    }

    function Oo(e, t, a, l, s, c) {
        return na = c, ze = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, Z.H = e === null || e.memoizedState === null ? Gh : ko, si = !1, c = a(l, s), si = !1, Fi && (c = fh(t, a, l, s)), ch(e), c
    }

    function ch(e) {
        Z.H = Gl;
        var t = Ye !== null && Ye.next !== null;
        if (na = 0, vt = Ye = ze = null, ru = !1, $l = 0, Xi = null, t) throw Error(u(300));
        e === null || gt || (e = e.dependencies, e !== null && Pr(e) && (gt = !0))
    }

    function fh(e, t, a, l) {
        ze = e;
        var s = 0;
        do {
            if (Fi && (Xi = null), $l = 0, Fi = !1, 25 <= s) throw Error(u(301));
            if (s += 1, vt = Ye = null, e.updateQueue != null) {
                var c = e.updateQueue;
                c.lastEffect = null, c.events = null, c.stores = null, c.memoCache != null && (c.memoCache.index = 0)
            }
            Z.H = Fh, c = t(a, l)
        } while (Fi);
        return c
    }

    function Nb() {
        var e = Z.H, t = e.useState()[0];
        return t = typeof t.then == "function" ? Ql(t) : t, e = e.useState()[0], (Ye !== null ? Ye.memoizedState : null) !== e && (ze.flags |= 1024), t
    }

    function To() {
        var e = uu !== 0;
        return uu = 0, e
    }

    function jo(e, t, a) {
        t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~a
    }

    function Ao(e) {
        if (ru) {
            for (e = e.memoizedState; e !== null;) {
                var t = e.queue;
                t !== null && (t.pending = null), e = e.next
            }
            ru = !1
        }
        na = 0, vt = Ye = ze = null, Fi = !1, $l = uu = 0, Xi = null
    }

    function qt() {
        var e = {memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null};
        return vt === null ? ze.memoizedState = vt = e : vt = vt.next = e, vt
    }

    function mt() {
        if (Ye === null) {
            var e = ze.alternate;
            e = e !== null ? e.memoizedState : null
        } else e = Ye.next;
        var t = vt === null ? ze.memoizedState : vt.next;
        if (t !== null) vt = t, Ye = e; else {
            if (e === null) throw ze.alternate === null ? Error(u(467)) : Error(u(310));
            Ye = e, e = {
                memoizedState: Ye.memoizedState,
                baseState: Ye.baseState,
                baseQueue: Ye.baseQueue,
                queue: Ye.queue,
                next: null
            }, vt === null ? ze.memoizedState = vt = e : vt = vt.next = e
        }
        return vt
    }

    function su() {
        return {lastEffect: null, events: null, stores: null, memoCache: null}
    }

    function Ql(e) {
        var t = $l;
        return $l += 1, Xi === null && (Xi = []), e = th(Xi, e, t), t = ze, (vt === null ? t.memoizedState : vt.next) === null && (t = t.alternate, Z.H = t === null || t.memoizedState === null ? Gh : ko), e
    }

    function ou(e) {
        if (e !== null && typeof e == "object") {
            if (typeof e.then == "function") return Ql(e);
            if (e.$$typeof === W) return wt(e)
        }
        throw Error(u(438, String(e)))
    }

    function Ro(e) {
        var t = null, a = ze.updateQueue;
        if (a !== null && (t = a.memoCache), t == null) {
            var l = ze.alternate;
            l !== null && (l = l.updateQueue, l !== null && (l = l.memoCache, l != null && (t = {
                data: l.data.map(function (s) {
                    return s.slice()
                }), index: 0
            })))
        }
        if (t == null && (t = {
            data: [],
            index: 0
        }), a === null && (a = su(), ze.updateQueue = a), a.memoCache = t, a = t.data[t.index], a === void 0) for (a = t.data[t.index] = Array(e), l = 0; l < e; l++) a[l] = Le;
        return t.index++, a
    }

    function aa(e, t) {
        return typeof t == "function" ? t(e) : t
    }

    function cu(e) {
        var t = mt();
        return wo(t, Ye, e)
    }

    function wo(e, t, a) {
        var l = e.queue;
        if (l === null) throw Error(u(311));
        l.lastRenderedReducer = a;
        var s = e.baseQueue, c = l.pending;
        if (c !== null) {
            if (s !== null) {
                var h = s.next;
                s.next = c.next, c.next = h
            }
            t.baseQueue = s = c, l.pending = null
        }
        if (c = e.baseState, s === null) e.memoizedState = c; else {
            t = s.next;
            var g = h = null, E = null, C = t, B = !1;
            do {
                var Q = C.lane & -536870913;
                if (Q !== C.lane ? (Ce & Q) === Q : (na & Q) === Q) {
                    var M = C.revertLane;
                    if (M === 0) E !== null && (E = E.next = {
                        lane: 0,
                        revertLane: 0,
                        gesture: null,
                        action: C.action,
                        hasEagerState: C.hasEagerState,
                        eagerState: C.eagerState,
                        next: null
                    }), Q === Vi && (B = !0); else if ((na & M) === M) {
                        C = C.next, M === Vi && (B = !0);
                        continue
                    } else Q = {
                        lane: 0,
                        revertLane: C.revertLane,
                        gesture: null,
                        action: C.action,
                        hasEagerState: C.hasEagerState,
                        eagerState: C.eagerState,
                        next: null
                    }, E === null ? (g = E = Q, h = c) : E = E.next = Q, ze.lanes |= M, Na |= M;
                    Q = C.action, si && a(c, Q), c = C.hasEagerState ? C.eagerState : a(c, Q)
                } else M = {
                    lane: Q,
                    revertLane: C.revertLane,
                    gesture: C.gesture,
                    action: C.action,
                    hasEagerState: C.hasEagerState,
                    eagerState: C.eagerState,
                    next: null
                }, E === null ? (g = E = M, h = c) : E = E.next = M, ze.lanes |= Q, Na |= Q;
                C = C.next
            } while (C !== null && C !== t);
            if (E === null ? h = c : E.next = g, !en(c, e.memoizedState) && (gt = !0, B && (a = $i, a !== null))) throw a;
            e.memoizedState = c, e.baseState = h, e.baseQueue = E, l.lastRenderedState = c
        }
        return s === null && (l.lanes = 0), [e.memoizedState, l.dispatch]
    }

    function No(e) {
        var t = mt(), a = t.queue;
        if (a === null) throw Error(u(311));
        a.lastRenderedReducer = e;
        var l = a.dispatch, s = a.pending, c = t.memoizedState;
        if (s !== null) {
            a.pending = null;
            var h = s = s.next;
            do c = e(c, h.action), h = h.next; while (h !== s);
            en(c, t.memoizedState) || (gt = !0), t.memoizedState = c, t.baseQueue === null && (t.baseState = c), a.lastRenderedState = c
        }
        return [c, l]
    }

    function dh(e, t, a) {
        var l = ze, s = mt(), c = Me;
        if (c) {
            if (a === void 0) throw Error(u(407));
            a = a()
        } else a = t();
        var h = !en((Ye || s).memoizedState, a);
        if (h && (s.memoizedState = a, gt = !0), s = s.queue, Mo(ph.bind(null, l, s, e), [e]), s.getSnapshot !== t || h || vt !== null && vt.memoizedState.tag & 1) {
            if (l.flags |= 2048, Ji(9, {destroy: void 0}, mh.bind(null, l, s, a, t), null), Ke === null) throw Error(u(349));
            c || (na & 127) !== 0 || hh(l, t, a)
        }
        return a
    }

    function hh(e, t, a) {
        e.flags |= 16384, e = {
            getSnapshot: t,
            value: a
        }, t = ze.updateQueue, t === null ? (t = su(), ze.updateQueue = t, t.stores = [e]) : (a = t.stores, a === null ? t.stores = [e] : a.push(e))
    }

    function mh(e, t, a, l) {
        t.value = a, t.getSnapshot = l, yh(t) && vh(e)
    }

    function ph(e, t, a) {
        return a(function () {
            yh(t) && vh(e)
        })
    }

    function yh(e) {
        var t = e.getSnapshot;
        e = e.value;
        try {
            var a = t();
            return !en(e, a)
        } catch {
            return !0
        }
    }

    function vh(e) {
        var t = Wa(e, 2);
        t !== null && Pt(t, e, 2)
    }

    function Co(e) {
        var t = qt();
        if (typeof e == "function") {
            var a = e;
            if (e = a(), si) {
                Se(!0);
                try {
                    a()
                } finally {
                    Se(!1)
                }
            }
        }
        return t.memoizedState = t.baseState = e, t.queue = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: aa,
            lastRenderedState: e
        }, t
    }

    function gh(e, t, a, l) {
        return e.baseState = a, wo(e, Ye, typeof l == "function" ? l : aa)
    }

    function Cb(e, t, a, l, s) {
        if (hu(e)) throw Error(u(485));
        if (e = t.action, e !== null) {
            var c = {
                payload: s,
                action: e,
                next: null,
                isTransition: !0,
                status: "pending",
                value: null,
                reason: null,
                listeners: [],
                then: function (h) {
                    c.listeners.push(h)
                }
            };
            Z.T !== null ? a(!0) : c.isTransition = !1, l(c), a = t.pending, a === null ? (c.next = t.pending = c, bh(t, c)) : (c.next = a.next, t.pending = a.next = c)
        }
    }

    function bh(e, t) {
        var a = t.action, l = t.payload, s = e.state;
        if (t.isTransition) {
            var c = Z.T, h = {};
            Z.T = h;
            try {
                var g = a(s, l), E = Z.S;
                E !== null && E(h, g), _h(e, t, g)
            } catch (C) {
                Do(e, t, C)
            } finally {
                c !== null && h.types !== null && (c.types = h.types), Z.T = c
            }
        } else try {
            c = a(s, l), _h(e, t, c)
        } catch (C) {
            Do(e, t, C)
        }
    }

    function _h(e, t, a) {
        a !== null && typeof a == "object" && typeof a.then == "function" ? a.then(function (l) {
            Sh(e, t, l)
        }, function (l) {
            return Do(e, t, l)
        }) : Sh(e, t, a)
    }

    function Sh(e, t, a) {
        t.status = "fulfilled", t.value = a, Eh(t), e.state = a, t = e.pending, t !== null && (a = t.next, a === t ? e.pending = null : (a = a.next, t.next = a, bh(e, a)))
    }

    function Do(e, t, a) {
        var l = e.pending;
        if (e.pending = null, l !== null) {
            l = l.next;
            do t.status = "rejected", t.reason = a, Eh(t), t = t.next; while (t !== l)
        }
        e.action = null
    }

    function Eh(e) {
        e = e.listeners;
        for (var t = 0; t < e.length; t++) (0, e[t])()
    }

    function xh(e, t) {
        return t
    }

    function zh(e, t) {
        if (Me) {
            var a = Ke.formState;
            if (a !== null) {
                e:{
                    var l = ze;
                    if (Me) {
                        if (We) {
                            t:{
                                for (var s = We, c = _n; s.nodeType !== 8;) {
                                    if (!c) {
                                        s = null;
                                        break t
                                    }
                                    if (s = En(s.nextSibling), s === null) {
                                        s = null;
                                        break t
                                    }
                                }
                                c = s.data, s = c === "F!" || c === "F" ? s : null
                            }
                            if (s) {
                                We = En(s.nextSibling), l = s.data === "F!";
                                break e
                            }
                        }
                        Ea(l)
                    }
                    l = !1
                }
                l && (t = a[0])
            }
        }
        return a = qt(), a.memoizedState = a.baseState = t, l = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: xh,
            lastRenderedState: t
        }, a.queue = l, a = $h.bind(null, ze, l), l.dispatch = a, l = Co(!1), c = Bo.bind(null, ze, !1, l.queue), l = qt(), s = {
            state: t,
            dispatch: null,
            action: e,
            pending: null
        }, l.queue = s, a = Cb.bind(null, ze, s, c, a), s.dispatch = a, l.memoizedState = e, [t, a, !1]
    }

    function Oh(e) {
        var t = mt();
        return Th(t, Ye, e)
    }

    function Th(e, t, a) {
        if (t = wo(e, t, xh)[0], e = cu(aa)[0], typeof t == "object" && t !== null && typeof t.then == "function") try {
            var l = Ql(t)
        } catch (h) {
            throw h === Qi ? eu : h
        } else l = t;
        t = mt();
        var s = t.queue, c = s.dispatch;
        return a !== t.memoizedState && (ze.flags |= 2048, Ji(9, {destroy: void 0}, Db.bind(null, s, a), null)), [l, c, e]
    }

    function Db(e, t) {
        e.action = t
    }

    function jh(e) {
        var t = mt(), a = Ye;
        if (a !== null) return Th(t, a, e);
        mt(), t = t.memoizedState, a = mt();
        var l = a.queue.dispatch;
        return a.memoizedState = e, [t, l, !1]
    }

    function Ji(e, t, a, l) {
        return e = {
            tag: e,
            create: a,
            deps: l,
            inst: t,
            next: null
        }, t = ze.updateQueue, t === null && (t = su(), ze.updateQueue = t), a = t.lastEffect, a === null ? t.lastEffect = e.next = e : (l = a.next, a.next = e, e.next = l, t.lastEffect = e), e
    }

    function Ah() {
        return mt().memoizedState
    }

    function fu(e, t, a, l) {
        var s = qt();
        ze.flags |= e, s.memoizedState = Ji(1 | t, {destroy: void 0}, a, l === void 0 ? null : l)
    }

    function du(e, t, a, l) {
        var s = mt();
        l = l === void 0 ? null : l;
        var c = s.memoizedState.inst;
        Ye !== null && l !== null && zo(l, Ye.memoizedState.deps) ? s.memoizedState = Ji(t, c, a, l) : (ze.flags |= e, s.memoizedState = Ji(1 | t, c, a, l))
    }

    function Rh(e, t) {
        fu(8390656, 8, e, t)
    }

    function Mo(e, t) {
        du(2048, 8, e, t)
    }

    function Mb(e) {
        ze.flags |= 4;
        var t = ze.updateQueue;
        if (t === null) t = su(), ze.updateQueue = t, t.events = [e]; else {
            var a = t.events;
            a === null ? t.events = [e] : a.push(e)
        }
    }

    function wh(e) {
        var t = mt().memoizedState;
        return Mb({ref: t, nextImpl: e}), function () {
            if ((Ve & 2) !== 0) throw Error(u(440));
            return t.impl.apply(void 0, arguments)
        }
    }

    function Nh(e, t) {
        return du(4, 2, e, t)
    }

    function Ch(e, t) {
        return du(4, 4, e, t)
    }

    function Dh(e, t) {
        if (typeof t == "function") {
            e = e();
            var a = t(e);
            return function () {
                typeof a == "function" ? a() : t(null)
            }
        }
        if (t != null) return e = e(), t.current = e, function () {
            t.current = null
        }
    }

    function Mh(e, t, a) {
        a = a != null ? a.concat([e]) : null, du(4, 4, Dh.bind(null, t, e), a)
    }

    function Uo() {
    }

    function Uh(e, t) {
        var a = mt();
        t = t === void 0 ? null : t;
        var l = a.memoizedState;
        return t !== null && zo(t, l[1]) ? l[0] : (a.memoizedState = [e, t], e)
    }

    function Zh(e, t) {
        var a = mt();
        t = t === void 0 ? null : t;
        var l = a.memoizedState;
        if (t !== null && zo(t, l[1])) return l[0];
        if (l = e(), si) {
            Se(!0);
            try {
                e()
            } finally {
                Se(!1)
            }
        }
        return a.memoizedState = [l, t], l
    }

    function Zo(e, t, a) {
        return a === void 0 || (na & 1073741824) !== 0 && (Ce & 261930) === 0 ? e.memoizedState = t : (e.memoizedState = a, e = Lm(), ze.lanes |= e, Na |= e, a)
    }

    function Lh(e, t, a, l) {
        return en(a, t) ? a : Gi.current !== null ? (e = Zo(e, a, l), en(e, t) || (gt = !0), e) : (na & 42) === 0 || (na & 1073741824) !== 0 && (Ce & 261930) === 0 ? (gt = !0, e.memoizedState = a) : (e = Lm(), ze.lanes |= e, Na |= e, t)
    }

    function qh(e, t, a, l, s) {
        var c = K.p;
        K.p = c !== 0 && 8 > c ? c : 8;
        var h = Z.T, g = {};
        Z.T = g, Bo(e, !1, t, a);
        try {
            var E = s(), C = Z.S;
            if (C !== null && C(g, E), E !== null && typeof E == "object" && typeof E.then == "function") {
                var B = Rb(E, l);
                Yl(e, t, B, un(e))
            } else Yl(e, t, l, un(e))
        } catch (Q) {
            Yl(e, t, {
                then: function () {
                }, status: "rejected", reason: Q
            }, un())
        } finally {
            K.p = c, h !== null && g.types !== null && (h.types = g.types), Z.T = h
        }
    }

    function Ub() {
    }

    function Lo(e, t, a, l) {
        if (e.tag !== 5) throw Error(u(476));
        var s = Bh(e).queue;
        qh(e, s, t, ue, a === null ? Ub : function () {
            return kh(e), a(l)
        })
    }

    function Bh(e) {
        var t = e.memoizedState;
        if (t !== null) return t;
        t = {
            memoizedState: ue,
            baseState: ue,
            baseQueue: null,
            queue: {pending: null, lanes: 0, dispatch: null, lastRenderedReducer: aa, lastRenderedState: ue},
            next: null
        };
        var a = {};
        return t.next = {
            memoizedState: a,
            baseState: a,
            baseQueue: null,
            queue: {pending: null, lanes: 0, dispatch: null, lastRenderedReducer: aa, lastRenderedState: a},
            next: null
        }, e.memoizedState = t, e = e.alternate, e !== null && (e.memoizedState = t), t
    }

    function kh(e) {
        var t = Bh(e);
        t.next === null && (t = e.alternate.memoizedState), Yl(e, t.next.queue, {}, un())
    }

    function qo() {
        return wt(sr)
    }

    function Hh() {
        return mt().memoizedState
    }

    function Vh() {
        return mt().memoizedState
    }

    function Zb(e) {
        for (var t = e.return; t !== null;) {
            switch (t.tag) {
                case 24:
                case 3:
                    var a = un();
                    e = Oa(a);
                    var l = Ta(t, e, a);
                    l !== null && (Pt(l, t, a), kl(l, t, a)), t = {cache: ho()}, e.payload = t;
                    return
            }
            t = t.return
        }
    }

    function Lb(e, t, a) {
        var l = un();
        a = {
            lane: l,
            revertLane: 0,
            gesture: null,
            action: a,
            hasEagerState: !1,
            eagerState: null,
            next: null
        }, hu(e) ? Qh(t, a) : (a = to(e, t, a, l), a !== null && (Pt(a, e, l), Yh(a, t, l)))
    }

    function $h(e, t, a) {
        var l = un();
        Yl(e, t, a, l)
    }

    function Yl(e, t, a, l) {
        var s = {lane: l, revertLane: 0, gesture: null, action: a, hasEagerState: !1, eagerState: null, next: null};
        if (hu(e)) Qh(t, s); else {
            var c = e.alternate;
            if (e.lanes === 0 && (c === null || c.lanes === 0) && (c = t.lastRenderedReducer, c !== null)) try {
                var h = t.lastRenderedState, g = c(h, a);
                if (s.hasEagerState = !0, s.eagerState = g, en(g, h)) return Fr(e, t, s, 0), Ke === null && Gr(), !1
            } catch {
            }
            if (a = to(e, t, s, l), a !== null) return Pt(a, e, l), Yh(a, t, l), !0
        }
        return !1
    }

    function Bo(e, t, a, l) {
        if (l = {
            lane: 2,
            revertLane: vc(),
            gesture: null,
            action: l,
            hasEagerState: !1,
            eagerState: null,
            next: null
        }, hu(e)) {
            if (t) throw Error(u(479))
        } else t = to(e, a, l, 2), t !== null && Pt(t, e, 2)
    }

    function hu(e) {
        var t = e.alternate;
        return e === ze || t !== null && t === ze
    }

    function Qh(e, t) {
        Fi = ru = !0;
        var a = e.pending;
        a === null ? t.next = t : (t.next = a.next, a.next = t), e.pending = t
    }

    function Yh(e, t, a) {
        if ((a & 4194048) !== 0) {
            var l = t.lanes;
            l &= e.pendingLanes, a |= l, t.lanes = a, Kf(e, a)
        }
    }

    var Gl = {
        readContext: wt,
        use: ou,
        useCallback: ot,
        useContext: ot,
        useEffect: ot,
        useImperativeHandle: ot,
        useLayoutEffect: ot,
        useInsertionEffect: ot,
        useMemo: ot,
        useReducer: ot,
        useRef: ot,
        useState: ot,
        useDebugValue: ot,
        useDeferredValue: ot,
        useTransition: ot,
        useSyncExternalStore: ot,
        useId: ot,
        useHostTransitionStatus: ot,
        useFormState: ot,
        useActionState: ot,
        useOptimistic: ot,
        useMemoCache: ot,
        useCacheRefresh: ot
    };
    Gl.useEffectEvent = ot;
    var Gh = {
        readContext: wt, use: ou, useCallback: function (e, t) {
            return qt().memoizedState = [e, t === void 0 ? null : t], e
        }, useContext: wt, useEffect: Rh, useImperativeHandle: function (e, t, a) {
            a = a != null ? a.concat([e]) : null, fu(4194308, 4, Dh.bind(null, t, e), a)
        }, useLayoutEffect: function (e, t) {
            return fu(4194308, 4, e, t)
        }, useInsertionEffect: function (e, t) {
            fu(4, 2, e, t)
        }, useMemo: function (e, t) {
            var a = qt();
            t = t === void 0 ? null : t;
            var l = e();
            if (si) {
                Se(!0);
                try {
                    e()
                } finally {
                    Se(!1)
                }
            }
            return a.memoizedState = [l, t], l
        }, useReducer: function (e, t, a) {
            var l = qt();
            if (a !== void 0) {
                var s = a(t);
                if (si) {
                    Se(!0);
                    try {
                        a(t)
                    } finally {
                        Se(!1)
                    }
                }
            } else s = t;
            return l.memoizedState = l.baseState = s, e = {
                pending: null,
                lanes: 0,
                dispatch: null,
                lastRenderedReducer: e,
                lastRenderedState: s
            }, l.queue = e, e = e.dispatch = Lb.bind(null, ze, e), [l.memoizedState, e]
        }, useRef: function (e) {
            var t = qt();
            return e = {current: e}, t.memoizedState = e
        }, useState: function (e) {
            e = Co(e);
            var t = e.queue, a = $h.bind(null, ze, t);
            return t.dispatch = a, [e.memoizedState, a]
        }, useDebugValue: Uo, useDeferredValue: function (e, t) {
            var a = qt();
            return Zo(a, e, t)
        }, useTransition: function () {
            var e = Co(!1);
            return e = qh.bind(null, ze, e.queue, !0, !1), qt().memoizedState = e, [!1, e]
        }, useSyncExternalStore: function (e, t, a) {
            var l = ze, s = qt();
            if (Me) {
                if (a === void 0) throw Error(u(407));
                a = a()
            } else {
                if (a = t(), Ke === null) throw Error(u(349));
                (Ce & 127) !== 0 || hh(l, t, a)
            }
            s.memoizedState = a;
            var c = {value: a, getSnapshot: t};
            return s.queue = c, Rh(ph.bind(null, l, c, e), [e]), l.flags |= 2048, Ji(9, {destroy: void 0}, mh.bind(null, l, c, a, t), null), a
        }, useId: function () {
            var e = qt(), t = Ke.identifierPrefix;
            if (Me) {
                var a = Hn, l = kn;
                a = (l & ~(1 << 32 - Ze(l) - 1)).toString(32) + a, t = "_" + t + "R_" + a, a = uu++, 0 < a && (t += "H" + a.toString(32)), t += "_"
            } else a = wb++, t = "_" + t + "r_" + a.toString(32) + "_";
            return e.memoizedState = t
        }, useHostTransitionStatus: qo, useFormState: zh, useActionState: zh, useOptimistic: function (e) {
            var t = qt();
            t.memoizedState = t.baseState = e;
            var a = {pending: null, lanes: 0, dispatch: null, lastRenderedReducer: null, lastRenderedState: null};
            return t.queue = a, t = Bo.bind(null, ze, !0, a), a.dispatch = t, [e, t]
        }, useMemoCache: Ro, useCacheRefresh: function () {
            return qt().memoizedState = Zb.bind(null, ze)
        }, useEffectEvent: function (e) {
            var t = qt(), a = {impl: e};
            return t.memoizedState = a, function () {
                if ((Ve & 2) !== 0) throw Error(u(440));
                return a.impl.apply(void 0, arguments)
            }
        }
    }, ko = {
        readContext: wt,
        use: ou,
        useCallback: Uh,
        useContext: wt,
        useEffect: Mo,
        useImperativeHandle: Mh,
        useInsertionEffect: Nh,
        useLayoutEffect: Ch,
        useMemo: Zh,
        useReducer: cu,
        useRef: Ah,
        useState: function () {
            return cu(aa)
        },
        useDebugValue: Uo,
        useDeferredValue: function (e, t) {
            var a = mt();
            return Lh(a, Ye.memoizedState, e, t)
        },
        useTransition: function () {
            var e = cu(aa)[0], t = mt().memoizedState;
            return [typeof e == "boolean" ? e : Ql(e), t]
        },
        useSyncExternalStore: dh,
        useId: Hh,
        useHostTransitionStatus: qo,
        useFormState: Oh,
        useActionState: Oh,
        useOptimistic: function (e, t) {
            var a = mt();
            return gh(a, Ye, e, t)
        },
        useMemoCache: Ro,
        useCacheRefresh: Vh
    };
    ko.useEffectEvent = wh;
    var Fh = {
        readContext: wt,
        use: ou,
        useCallback: Uh,
        useContext: wt,
        useEffect: Mo,
        useImperativeHandle: Mh,
        useInsertionEffect: Nh,
        useLayoutEffect: Ch,
        useMemo: Zh,
        useReducer: No,
        useRef: Ah,
        useState: function () {
            return No(aa)
        },
        useDebugValue: Uo,
        useDeferredValue: function (e, t) {
            var a = mt();
            return Ye === null ? Zo(a, e, t) : Lh(a, Ye.memoizedState, e, t)
        },
        useTransition: function () {
            var e = No(aa)[0], t = mt().memoizedState;
            return [typeof e == "boolean" ? e : Ql(e), t]
        },
        useSyncExternalStore: dh,
        useId: Hh,
        useHostTransitionStatus: qo,
        useFormState: jh,
        useActionState: jh,
        useOptimistic: function (e, t) {
            var a = mt();
            return Ye !== null ? gh(a, Ye, e, t) : (a.baseState = e, [e, a.queue.dispatch])
        },
        useMemoCache: Ro,
        useCacheRefresh: Vh
    };
    Fh.useEffectEvent = wh;

    function Ho(e, t, a, l) {
        t = e.memoizedState, a = a(l, t), a = a == null ? t : S({}, t, a), e.memoizedState = a, e.lanes === 0 && (e.updateQueue.baseState = a)
    }

    var Vo = {
        enqueueSetState: function (e, t, a) {
            e = e._reactInternals;
            var l = un(), s = Oa(l);
            s.payload = t, a != null && (s.callback = a), t = Ta(e, s, l), t !== null && (Pt(t, e, l), kl(t, e, l))
        }, enqueueReplaceState: function (e, t, a) {
            e = e._reactInternals;
            var l = un(), s = Oa(l);
            s.tag = 1, s.payload = t, a != null && (s.callback = a), t = Ta(e, s, l), t !== null && (Pt(t, e, l), kl(t, e, l))
        }, enqueueForceUpdate: function (e, t) {
            e = e._reactInternals;
            var a = un(), l = Oa(a);
            l.tag = 2, t != null && (l.callback = t), t = Ta(e, l, a), t !== null && (Pt(t, e, a), kl(t, e, a))
        }
    };

    function Xh(e, t, a, l, s, c, h) {
        return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(l, c, h) : t.prototype && t.prototype.isPureReactComponent ? !Cl(a, l) || !Cl(s, c) : !0
    }

    function Jh(e, t, a, l) {
        e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(a, l), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(a, l), t.state !== e && Vo.enqueueReplaceState(t, t.state, null)
    }

    function oi(e, t) {
        var a = t;
        if ("ref" in t) {
            a = {};
            for (var l in t) l !== "ref" && (a[l] = t[l])
        }
        if (e = e.defaultProps) {
            a === t && (a = S({}, a));
            for (var s in e) a[s] === void 0 && (a[s] = e[s])
        }
        return a
    }

    function Kh(e) {
        Yr(e)
    }

    function Ph(e) {
        console.error(e)
    }

    function Ih(e) {
        Yr(e)
    }

    function mu(e, t) {
        try {
            var a = e.onUncaughtError;
            a(t.value, {componentStack: t.stack})
        } catch (l) {
            setTimeout(function () {
                throw l
            })
        }
    }

    function Wh(e, t, a) {
        try {
            var l = e.onCaughtError;
            l(a.value, {componentStack: a.stack, errorBoundary: t.tag === 1 ? t.stateNode : null})
        } catch (s) {
            setTimeout(function () {
                throw s
            })
        }
    }

    function $o(e, t, a) {
        return a = Oa(a), a.tag = 3, a.payload = {element: null}, a.callback = function () {
            mu(e, t)
        }, a
    }

    function em(e) {
        return e = Oa(e), e.tag = 3, e
    }

    function tm(e, t, a, l) {
        var s = a.type.getDerivedStateFromError;
        if (typeof s == "function") {
            var c = l.value;
            e.payload = function () {
                return s(c)
            }, e.callback = function () {
                Wh(t, a, l)
            }
        }
        var h = a.stateNode;
        h !== null && typeof h.componentDidCatch == "function" && (e.callback = function () {
            Wh(t, a, l), typeof s != "function" && (Ca === null ? Ca = new Set([this]) : Ca.add(this));
            var g = l.stack;
            this.componentDidCatch(l.value, {componentStack: g !== null ? g : ""})
        })
    }

    function qb(e, t, a, l, s) {
        if (a.flags |= 32768, l !== null && typeof l == "object" && typeof l.then == "function") {
            if (t = a.alternate, t !== null && Hi(t, a, s, !0), a = nn.current, a !== null) {
                switch (a.tag) {
                    case 31:
                    case 13:
                        return Sn === null ? Tu() : a.alternate === null && ct === 0 && (ct = 3), a.flags &= -257, a.flags |= 65536, a.lanes = s, l === tu ? a.flags |= 16384 : (t = a.updateQueue, t === null ? a.updateQueue = new Set([l]) : t.add(l), mc(e, l, s)), !1;
                    case 22:
                        return a.flags |= 65536, l === tu ? a.flags |= 16384 : (t = a.updateQueue, t === null ? (t = {
                            transitions: null,
                            markerInstances: null,
                            retryQueue: new Set([l])
                        }, a.updateQueue = t) : (a = t.retryQueue, a === null ? t.retryQueue = new Set([l]) : a.add(l)), mc(e, l, s)), !1
                }
                throw Error(u(435, a.tag))
            }
            return mc(e, l, s), Tu(), !1
        }
        if (Me) return t = nn.current, t !== null ? ((t.flags & 65536) === 0 && (t.flags |= 256), t.flags |= 65536, t.lanes = s, l !== uo && (e = Error(u(422), {cause: l}), Ul(vn(e, a)))) : (l !== uo && (t = Error(u(423), {cause: l}), Ul(vn(t, a))), e = e.current.alternate, e.flags |= 65536, s &= -s, e.lanes |= s, l = vn(l, a), s = $o(e.stateNode, l, s), bo(e, s), ct !== 4 && (ct = 2)), !1;
        var c = Error(u(520), {cause: l});
        if (c = vn(c, a), er === null ? er = [c] : er.push(c), ct !== 4 && (ct = 2), t === null) return !0;
        l = vn(l, a), a = t;
        do {
            switch (a.tag) {
                case 3:
                    return a.flags |= 65536, e = s & -s, a.lanes |= e, e = $o(a.stateNode, l, e), bo(a, e), !1;
                case 1:
                    if (t = a.type, c = a.stateNode, (a.flags & 128) === 0 && (typeof t.getDerivedStateFromError == "function" || c !== null && typeof c.componentDidCatch == "function" && (Ca === null || !Ca.has(c)))) return a.flags |= 65536, s &= -s, a.lanes |= s, s = em(s), tm(s, e, a, l), bo(a, s), !1
            }
            a = a.return
        } while (a !== null);
        return !1
    }

    var Qo = Error(u(461)), gt = !1;

    function Nt(e, t, a, l) {
        t.child = e === null ? lh(t, null, a, l) : ui(t, e.child, a, l)
    }

    function nm(e, t, a, l, s) {
        a = a.render;
        var c = t.ref;
        if ("ref" in l) {
            var h = {};
            for (var g in l) g !== "ref" && (h[g] = l[g])
        } else h = l;
        return ai(t), l = Oo(e, t, a, h, c, s), g = To(), e !== null && !gt ? (jo(e, t, s), ia(e, t, s)) : (Me && g && lo(t), t.flags |= 1, Nt(e, t, l, s), t.child)
    }

    function am(e, t, a, l, s) {
        if (e === null) {
            var c = a.type;
            return typeof c == "function" && !no(c) && c.defaultProps === void 0 && a.compare === null ? (t.tag = 15, t.type = c, im(e, t, c, l, s)) : (e = Jr(a.type, null, l, t, t.mode, s), e.ref = t.ref, e.return = t, t.child = e)
        }
        if (c = e.child, !Io(e, s)) {
            var h = c.memoizedProps;
            if (a = a.compare, a = a !== null ? a : Cl, a(h, l) && e.ref === t.ref) return ia(e, t, s)
        }
        return t.flags |= 1, e = In(c, l), e.ref = t.ref, e.return = t, t.child = e
    }

    function im(e, t, a, l, s) {
        if (e !== null) {
            var c = e.memoizedProps;
            if (Cl(c, l) && e.ref === t.ref) if (gt = !1, t.pendingProps = l = c, Io(e, s)) (e.flags & 131072) !== 0 && (gt = !0); else return t.lanes = e.lanes, ia(e, t, s)
        }
        return Yo(e, t, a, l, s)
    }

    function lm(e, t, a, l) {
        var s = l.children, c = e !== null ? e.memoizedState : null;
        if (e === null && t.stateNode === null && (t.stateNode = {
            _visibility: 1,
            _pendingMarkers: null,
            _retryCache: null,
            _transitions: null
        }), l.mode === "hidden") {
            if ((t.flags & 128) !== 0) {
                if (c = c !== null ? c.baseLanes | a : a, e !== null) {
                    for (l = t.child = e.child, s = 0; l !== null;) s = s | l.lanes | l.childLanes, l = l.sibling;
                    l = s & ~c
                } else l = 0, t.child = null;
                return rm(e, t, c, a, l)
            }
            if ((a & 536870912) !== 0) t.memoizedState = {
                baseLanes: 0,
                cachePool: null
            }, e !== null && Wr(t, c !== null ? c.cachePool : null), c !== null ? sh(t, c) : So(), oh(t); else return l = t.lanes = 536870912, rm(e, t, c !== null ? c.baseLanes | a : a, a, l)
        } else c !== null ? (Wr(t, c.cachePool), sh(t, c), Aa(), t.memoizedState = null) : (e !== null && Wr(t, null), So(), Aa());
        return Nt(e, t, s, a), t.child
    }

    function Fl(e, t) {
        return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
            _visibility: 1,
            _pendingMarkers: null,
            _retryCache: null,
            _transitions: null
        }), t.sibling
    }

    function rm(e, t, a, l, s) {
        var c = po();
        return c = c === null ? null : {parent: yt._currentValue, pool: c}, t.memoizedState = {
            baseLanes: a,
            cachePool: c
        }, e !== null && Wr(t, null), So(), oh(t), e !== null && Hi(e, t, l, !0), t.childLanes = s, null
    }

    function pu(e, t) {
        return t = vu({mode: t.mode, children: t.children}, e.mode), t.ref = e.ref, e.child = t, t.return = e, t
    }

    function um(e, t, a) {
        return ui(t, e.child, null, a), e = pu(t, t.pendingProps), e.flags |= 2, an(t), t.memoizedState = null, e
    }

    function Bb(e, t, a) {
        var l = t.pendingProps, s = (t.flags & 128) !== 0;
        if (t.flags &= -129, e === null) {
            if (Me) {
                if (l.mode === "hidden") return e = pu(t, l), t.lanes = 536870912, Fl(null, e);
                if (xo(t), (e = We) ? (e = bp(e, _n), e = e !== null && e.data === "&" ? e : null, e !== null && (t.memoizedState = {
                    dehydrated: e,
                    treeContext: _a !== null ? {id: kn, overflow: Hn} : null,
                    retryLane: 536870912,
                    hydrationErrors: null
                }, a = Qd(e), a.return = t, t.child = a, Rt = t, We = null)) : e = null, e === null) throw Ea(t);
                return t.lanes = 536870912, null
            }
            return pu(t, l)
        }
        var c = e.memoizedState;
        if (c !== null) {
            var h = c.dehydrated;
            if (xo(t), s) if (t.flags & 256) t.flags &= -257, t = um(e, t, a); else if (t.memoizedState !== null) t.child = e.child, t.flags |= 128, t = null; else throw Error(u(558)); else if (gt || Hi(e, t, a, !1), s = (a & e.childLanes) !== 0, gt || s) {
                if (l = Ke, l !== null && (h = Pf(l, a), h !== 0 && h !== c.retryLane)) throw c.retryLane = h, Wa(e, h), Pt(l, e, h), Qo;
                Tu(), t = um(e, t, a)
            } else e = c.treeContext, We = En(h.nextSibling), Rt = t, Me = !0, Sa = null, _n = !1, e !== null && Fd(t, e), t = pu(t, l), t.flags |= 4096;
            return t
        }
        return e = In(e.child, {mode: l.mode, children: l.children}), e.ref = t.ref, t.child = e, e.return = t, e
    }

    function yu(e, t) {
        var a = t.ref;
        if (a === null) e !== null && e.ref !== null && (t.flags |= 4194816); else {
            if (typeof a != "function" && typeof a != "object") throw Error(u(284));
            (e === null || e.ref !== a) && (t.flags |= 4194816)
        }
    }

    function Yo(e, t, a, l, s) {
        return ai(t), a = Oo(e, t, a, l, void 0, s), l = To(), e !== null && !gt ? (jo(e, t, s), ia(e, t, s)) : (Me && l && lo(t), t.flags |= 1, Nt(e, t, a, s), t.child)
    }

    function sm(e, t, a, l, s, c) {
        return ai(t), t.updateQueue = null, a = fh(t, l, a, s), ch(e), l = To(), e !== null && !gt ? (jo(e, t, c), ia(e, t, c)) : (Me && l && lo(t), t.flags |= 1, Nt(e, t, a, c), t.child)
    }

    function om(e, t, a, l, s) {
        if (ai(t), t.stateNode === null) {
            var c = Li, h = a.contextType;
            typeof h == "object" && h !== null && (c = wt(h)), c = new a(l, c), t.memoizedState = c.state !== null && c.state !== void 0 ? c.state : null, c.updater = Vo, t.stateNode = c, c._reactInternals = t, c = t.stateNode, c.props = l, c.state = t.memoizedState, c.refs = {}, vo(t), h = a.contextType, c.context = typeof h == "object" && h !== null ? wt(h) : Li, c.state = t.memoizedState, h = a.getDerivedStateFromProps, typeof h == "function" && (Ho(t, a, h, l), c.state = t.memoizedState), typeof a.getDerivedStateFromProps == "function" || typeof c.getSnapshotBeforeUpdate == "function" || typeof c.UNSAFE_componentWillMount != "function" && typeof c.componentWillMount != "function" || (h = c.state, typeof c.componentWillMount == "function" && c.componentWillMount(), typeof c.UNSAFE_componentWillMount == "function" && c.UNSAFE_componentWillMount(), h !== c.state && Vo.enqueueReplaceState(c, c.state, null), Vl(t, l, c, s), Hl(), c.state = t.memoizedState), typeof c.componentDidMount == "function" && (t.flags |= 4194308), l = !0
        } else if (e === null) {
            c = t.stateNode;
            var g = t.memoizedProps, E = oi(a, g);
            c.props = E;
            var C = c.context, B = a.contextType;
            h = Li, typeof B == "object" && B !== null && (h = wt(B));
            var Q = a.getDerivedStateFromProps;
            B = typeof Q == "function" || typeof c.getSnapshotBeforeUpdate == "function", g = t.pendingProps !== g, B || typeof c.UNSAFE_componentWillReceiveProps != "function" && typeof c.componentWillReceiveProps != "function" || (g || C !== h) && Jh(t, c, l, h), za = !1;
            var M = t.memoizedState;
            c.state = M, Vl(t, l, c, s), Hl(), C = t.memoizedState, g || M !== C || za ? (typeof Q == "function" && (Ho(t, a, Q, l), C = t.memoizedState), (E = za || Xh(t, a, E, l, M, C, h)) ? (B || typeof c.UNSAFE_componentWillMount != "function" && typeof c.componentWillMount != "function" || (typeof c.componentWillMount == "function" && c.componentWillMount(), typeof c.UNSAFE_componentWillMount == "function" && c.UNSAFE_componentWillMount()), typeof c.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof c.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = l, t.memoizedState = C), c.props = l, c.state = C, c.context = h, l = E) : (typeof c.componentDidMount == "function" && (t.flags |= 4194308), l = !1)
        } else {
            c = t.stateNode, go(e, t), h = t.memoizedProps, B = oi(a, h), c.props = B, Q = t.pendingProps, M = c.context, C = a.contextType, E = Li, typeof C == "object" && C !== null && (E = wt(C)), g = a.getDerivedStateFromProps, (C = typeof g == "function" || typeof c.getSnapshotBeforeUpdate == "function") || typeof c.UNSAFE_componentWillReceiveProps != "function" && typeof c.componentWillReceiveProps != "function" || (h !== Q || M !== E) && Jh(t, c, l, E), za = !1, M = t.memoizedState, c.state = M, Vl(t, l, c, s), Hl();
            var L = t.memoizedState;
            h !== Q || M !== L || za || e !== null && e.dependencies !== null && Pr(e.dependencies) ? (typeof g == "function" && (Ho(t, a, g, l), L = t.memoizedState), (B = za || Xh(t, a, B, l, M, L, E) || e !== null && e.dependencies !== null && Pr(e.dependencies)) ? (C || typeof c.UNSAFE_componentWillUpdate != "function" && typeof c.componentWillUpdate != "function" || (typeof c.componentWillUpdate == "function" && c.componentWillUpdate(l, L, E), typeof c.UNSAFE_componentWillUpdate == "function" && c.UNSAFE_componentWillUpdate(l, L, E)), typeof c.componentDidUpdate == "function" && (t.flags |= 4), typeof c.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof c.componentDidUpdate != "function" || h === e.memoizedProps && M === e.memoizedState || (t.flags |= 4), typeof c.getSnapshotBeforeUpdate != "function" || h === e.memoizedProps && M === e.memoizedState || (t.flags |= 1024), t.memoizedProps = l, t.memoizedState = L), c.props = l, c.state = L, c.context = E, l = B) : (typeof c.componentDidUpdate != "function" || h === e.memoizedProps && M === e.memoizedState || (t.flags |= 4), typeof c.getSnapshotBeforeUpdate != "function" || h === e.memoizedProps && M === e.memoizedState || (t.flags |= 1024), l = !1)
        }
        return c = l, yu(e, t), l = (t.flags & 128) !== 0, c || l ? (c = t.stateNode, a = l && typeof a.getDerivedStateFromError != "function" ? null : c.render(), t.flags |= 1, e !== null && l ? (t.child = ui(t, e.child, null, s), t.child = ui(t, null, a, s)) : Nt(e, t, a, s), t.memoizedState = c.state, e = t.child) : e = ia(e, t, s), e
    }

    function cm(e, t, a, l) {
        return ti(), t.flags |= 256, Nt(e, t, a, l), t.child
    }

    var Go = {dehydrated: null, treeContext: null, retryLane: 0, hydrationErrors: null};

    function Fo(e) {
        return {baseLanes: e, cachePool: Wd()}
    }

    function Xo(e, t, a) {
        return e = e !== null ? e.childLanes & ~a : 0, t && (e |= rn), e
    }

    function fm(e, t, a) {
        var l = t.pendingProps, s = !1, c = (t.flags & 128) !== 0, h;
        if ((h = c) || (h = e !== null && e.memoizedState === null ? !1 : (ht.current & 2) !== 0), h && (s = !0, t.flags &= -129), h = (t.flags & 32) !== 0, t.flags &= -33, e === null) {
            if (Me) {
                if (s ? ja(t) : Aa(), (e = We) ? (e = bp(e, _n), e = e !== null && e.data !== "&" ? e : null, e !== null && (t.memoizedState = {
                    dehydrated: e,
                    treeContext: _a !== null ? {id: kn, overflow: Hn} : null,
                    retryLane: 536870912,
                    hydrationErrors: null
                }, a = Qd(e), a.return = t, t.child = a, Rt = t, We = null)) : e = null, e === null) throw Ea(t);
                return wc(e) ? t.lanes = 32 : t.lanes = 536870912, null
            }
            var g = l.children;
            return l = l.fallback, s ? (Aa(), s = t.mode, g = vu({
                mode: "hidden",
                children: g
            }, s), l = ei(l, s, a, null), g.return = t, l.return = t, g.sibling = l, t.child = g, l = t.child, l.memoizedState = Fo(a), l.childLanes = Xo(e, h, a), t.memoizedState = Go, Fl(null, l)) : (ja(t), Jo(t, g))
        }
        var E = e.memoizedState;
        if (E !== null && (g = E.dehydrated, g !== null)) {
            if (c) t.flags & 256 ? (ja(t), t.flags &= -257, t = Ko(e, t, a)) : t.memoizedState !== null ? (Aa(), t.child = e.child, t.flags |= 128, t = null) : (Aa(), g = l.fallback, s = t.mode, l = vu({
                mode: "visible",
                children: l.children
            }, s), g = ei(g, s, a, null), g.flags |= 2, l.return = t, g.return = t, l.sibling = g, t.child = l, ui(t, e.child, null, a), l = t.child, l.memoizedState = Fo(a), l.childLanes = Xo(e, h, a), t.memoizedState = Go, t = Fl(null, l)); else if (ja(t), wc(g)) {
                if (h = g.nextSibling && g.nextSibling.dataset, h) var C = h.dgst;
                h = C, l = Error(u(419)), l.stack = "", l.digest = h, Ul({
                    value: l,
                    source: null,
                    stack: null
                }), t = Ko(e, t, a)
            } else if (gt || Hi(e, t, a, !1), h = (a & e.childLanes) !== 0, gt || h) {
                if (h = Ke, h !== null && (l = Pf(h, a), l !== 0 && l !== E.retryLane)) throw E.retryLane = l, Wa(e, l), Pt(h, e, l), Qo;
                Rc(g) || Tu(), t = Ko(e, t, a)
            } else Rc(g) ? (t.flags |= 192, t.child = e.child, t = null) : (e = E.treeContext, We = En(g.nextSibling), Rt = t, Me = !0, Sa = null, _n = !1, e !== null && Fd(t, e), t = Jo(t, l.children), t.flags |= 4096);
            return t
        }
        return s ? (Aa(), g = l.fallback, s = t.mode, E = e.child, C = E.sibling, l = In(E, {
            mode: "hidden",
            children: l.children
        }), l.subtreeFlags = E.subtreeFlags & 65011712, C !== null ? g = In(C, g) : (g = ei(g, s, a, null), g.flags |= 2), g.return = t, l.return = t, l.sibling = g, t.child = l, Fl(null, l), l = t.child, g = e.child.memoizedState, g === null ? g = Fo(a) : (s = g.cachePool, s !== null ? (E = yt._currentValue, s = s.parent !== E ? {
            parent: E,
            pool: E
        } : s) : s = Wd(), g = {
            baseLanes: g.baseLanes | a,
            cachePool: s
        }), l.memoizedState = g, l.childLanes = Xo(e, h, a), t.memoizedState = Go, Fl(e.child, l)) : (ja(t), a = e.child, e = a.sibling, a = In(a, {
            mode: "visible",
            children: l.children
        }), a.return = t, a.sibling = null, e !== null && (h = t.deletions, h === null ? (t.deletions = [e], t.flags |= 16) : h.push(e)), t.child = a, t.memoizedState = null, a)
    }

    function Jo(e, t) {
        return t = vu({mode: "visible", children: t}, e.mode), t.return = e, e.child = t
    }

    function vu(e, t) {
        return e = tn(22, e, null, t), e.lanes = 0, e
    }

    function Ko(e, t, a) {
        return ui(t, e.child, null, a), e = Jo(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e
    }

    function dm(e, t, a) {
        e.lanes |= t;
        var l = e.alternate;
        l !== null && (l.lanes |= t), co(e.return, t, a)
    }

    function Po(e, t, a, l, s, c) {
        var h = e.memoizedState;
        h === null ? e.memoizedState = {
            isBackwards: t,
            rendering: null,
            renderingStartTime: 0,
            last: l,
            tail: a,
            tailMode: s,
            treeForkCount: c
        } : (h.isBackwards = t, h.rendering = null, h.renderingStartTime = 0, h.last = l, h.tail = a, h.tailMode = s, h.treeForkCount = c)
    }

    function hm(e, t, a) {
        var l = t.pendingProps, s = l.revealOrder, c = l.tail;
        l = l.children;
        var h = ht.current, g = (h & 2) !== 0;
        if (g ? (h = h & 1 | 2, t.flags |= 128) : h &= 1, I(ht, h), Nt(e, t, l, a), l = Me ? Ml : 0, !g && e !== null && (e.flags & 128) !== 0) e:for (e = t.child; e !== null;) {
            if (e.tag === 13) e.memoizedState !== null && dm(e, a, t); else if (e.tag === 19) dm(e, a, t); else if (e.child !== null) {
                e.child.return = e, e = e.child;
                continue
            }
            if (e === t) break e;
            for (; e.sibling === null;) {
                if (e.return === null || e.return === t) break e;
                e = e.return
            }
            e.sibling.return = e.return, e = e.sibling
        }
        switch (s) {
            case"forwards":
                for (a = t.child, s = null; a !== null;) e = a.alternate, e !== null && lu(e) === null && (s = a), a = a.sibling;
                a = s, a === null ? (s = t.child, t.child = null) : (s = a.sibling, a.sibling = null), Po(t, !1, s, a, c, l);
                break;
            case"backwards":
            case"unstable_legacy-backwards":
                for (a = null, s = t.child, t.child = null; s !== null;) {
                    if (e = s.alternate, e !== null && lu(e) === null) {
                        t.child = s;
                        break
                    }
                    e = s.sibling, s.sibling = a, a = s, s = e
                }
                Po(t, !0, a, null, c, l);
                break;
            case"together":
                Po(t, !1, null, null, void 0, l);
                break;
            default:
                t.memoizedState = null
        }
        return t.child
    }

    function ia(e, t, a) {
        if (e !== null && (t.dependencies = e.dependencies), Na |= t.lanes, (a & t.childLanes) === 0) if (e !== null) {
            if (Hi(e, t, a, !1), (a & t.childLanes) === 0) return null
        } else return null;
        if (e !== null && t.child !== e.child) throw Error(u(153));
        if (t.child !== null) {
            for (e = t.child, a = In(e, e.pendingProps), t.child = a, a.return = t; e.sibling !== null;) e = e.sibling, a = a.sibling = In(e, e.pendingProps), a.return = t;
            a.sibling = null
        }
        return t.child
    }

    function Io(e, t) {
        return (e.lanes & t) !== 0 ? !0 : (e = e.dependencies, !!(e !== null && Pr(e)))
    }

    function kb(e, t, a) {
        switch (t.tag) {
            case 3:
                lt(t, t.stateNode.containerInfo), xa(t, yt, e.memoizedState.cache), ti();
                break;
            case 27:
            case 5:
                dn(t);
                break;
            case 4:
                lt(t, t.stateNode.containerInfo);
                break;
            case 10:
                xa(t, t.type, t.memoizedProps.value);
                break;
            case 31:
                if (t.memoizedState !== null) return t.flags |= 128, xo(t), null;
                break;
            case 13:
                var l = t.memoizedState;
                if (l !== null) return l.dehydrated !== null ? (ja(t), t.flags |= 128, null) : (a & t.child.childLanes) !== 0 ? fm(e, t, a) : (ja(t), e = ia(e, t, a), e !== null ? e.sibling : null);
                ja(t);
                break;
            case 19:
                var s = (e.flags & 128) !== 0;
                if (l = (a & t.childLanes) !== 0, l || (Hi(e, t, a, !1), l = (a & t.childLanes) !== 0), s) {
                    if (l) return hm(e, t, a);
                    t.flags |= 128
                }
                if (s = t.memoizedState, s !== null && (s.rendering = null, s.tail = null, s.lastEffect = null), I(ht, ht.current), l) break;
                return null;
            case 22:
                return t.lanes = 0, lm(e, t, a, t.pendingProps);
            case 24:
                xa(t, yt, e.memoizedState.cache)
        }
        return ia(e, t, a)
    }

    function mm(e, t, a) {
        if (e !== null) if (e.memoizedProps !== t.pendingProps) gt = !0; else {
            if (!Io(e, a) && (t.flags & 128) === 0) return gt = !1, kb(e, t, a);
            gt = (e.flags & 131072) !== 0
        } else gt = !1, Me && (t.flags & 1048576) !== 0 && Gd(t, Ml, t.index);
        switch (t.lanes = 0, t.tag) {
            case 16:
                e:{
                    var l = t.pendingProps;
                    if (e = li(t.elementType), t.type = e, typeof e == "function") no(e) ? (l = oi(e, l), t.tag = 1, t = om(null, t, e, l, a)) : (t.tag = 0, t = Yo(null, t, e, l, a)); else {
                        if (e != null) {
                            var s = e.$$typeof;
                            if (s === Y) {
                                t.tag = 11, t = nm(null, t, e, l, a);
                                break e
                            } else if (s === le) {
                                t.tag = 14, t = am(null, t, e, l, a);
                                break e
                            }
                        }
                        throw t = je(e) || e, Error(u(306, t, ""))
                    }
                }
                return t;
            case 0:
                return Yo(e, t, t.type, t.pendingProps, a);
            case 1:
                return l = t.type, s = oi(l, t.pendingProps), om(e, t, l, s, a);
            case 3:
                e:{
                    if (lt(t, t.stateNode.containerInfo), e === null) throw Error(u(387));
                    l = t.pendingProps;
                    var c = t.memoizedState;
                    s = c.element, go(e, t), Vl(t, l, null, a);
                    var h = t.memoizedState;
                    if (l = h.cache, xa(t, yt, l), l !== c.cache && fo(t, [yt], a, !0), Hl(), l = h.element, c.isDehydrated) if (c = {
                        element: l,
                        isDehydrated: !1,
                        cache: h.cache
                    }, t.updateQueue.baseState = c, t.memoizedState = c, t.flags & 256) {
                        t = cm(e, t, l, a);
                        break e
                    } else if (l !== s) {
                        s = vn(Error(u(424)), t), Ul(s), t = cm(e, t, l, a);
                        break e
                    } else for (e = t.stateNode.containerInfo, e.nodeType === 9 ? e = e.body : e = e.nodeName === "HTML" ? e.ownerDocument.body : e, We = En(e.firstChild), Rt = t, Me = !0, Sa = null, _n = !0, a = lh(t, null, l, a), t.child = a; a;) a.flags = a.flags & -3 | 4096, a = a.sibling; else {
                        if (ti(), l === s) {
                            t = ia(e, t, a);
                            break e
                        }
                        Nt(e, t, l, a)
                    }
                    t = t.child
                }
                return t;
            case 26:
                return yu(e, t), e === null ? (a = Op(t.type, null, t.pendingProps, null)) ? t.memoizedState = a : Me || (a = t.type, e = t.pendingProps, l = Du(_e.current).createElement(a), l[At] = t, l[Yt] = e, Ct(l, a, e), Ot(l), t.stateNode = l) : t.memoizedState = Op(t.type, e.memoizedProps, t.pendingProps, e.memoizedState), null;
            case 27:
                return dn(t), e === null && Me && (l = t.stateNode = Ep(t.type, t.pendingProps, _e.current), Rt = t, _n = !0, s = We, Za(t.type) ? (Nc = s, We = En(l.firstChild)) : We = s), Nt(e, t, t.pendingProps.children, a), yu(e, t), e === null && (t.flags |= 4194304), t.child;
            case 5:
                return e === null && Me && ((s = l = We) && (l = y0(l, t.type, t.pendingProps, _n), l !== null ? (t.stateNode = l, Rt = t, We = En(l.firstChild), _n = !1, s = !0) : s = !1), s || Ea(t)), dn(t), s = t.type, c = t.pendingProps, h = e !== null ? e.memoizedProps : null, l = c.children, Tc(s, c) ? l = null : h !== null && Tc(s, h) && (t.flags |= 32), t.memoizedState !== null && (s = Oo(e, t, Nb, null, null, a), sr._currentValue = s), yu(e, t), Nt(e, t, l, a), t.child;
            case 6:
                return e === null && Me && ((e = a = We) && (a = v0(a, t.pendingProps, _n), a !== null ? (t.stateNode = a, Rt = t, We = null, e = !0) : e = !1), e || Ea(t)), null;
            case 13:
                return fm(e, t, a);
            case 4:
                return lt(t, t.stateNode.containerInfo), l = t.pendingProps, e === null ? t.child = ui(t, null, l, a) : Nt(e, t, l, a), t.child;
            case 11:
                return nm(e, t, t.type, t.pendingProps, a);
            case 7:
                return Nt(e, t, t.pendingProps, a), t.child;
            case 8:
                return Nt(e, t, t.pendingProps.children, a), t.child;
            case 12:
                return Nt(e, t, t.pendingProps.children, a), t.child;
            case 10:
                return l = t.pendingProps, xa(t, t.type, l.value), Nt(e, t, l.children, a), t.child;
            case 9:
                return s = t.type._context, l = t.pendingProps.children, ai(t), s = wt(s), l = l(s), t.flags |= 1, Nt(e, t, l, a), t.child;
            case 14:
                return am(e, t, t.type, t.pendingProps, a);
            case 15:
                return im(e, t, t.type, t.pendingProps, a);
            case 19:
                return hm(e, t, a);
            case 31:
                return Bb(e, t, a);
            case 22:
                return lm(e, t, a, t.pendingProps);
            case 24:
                return ai(t), l = wt(yt), e === null ? (s = po(), s === null && (s = Ke, c = ho(), s.pooledCache = c, c.refCount++, c !== null && (s.pooledCacheLanes |= a), s = c), t.memoizedState = {
                    parent: l,
                    cache: s
                }, vo(t), xa(t, yt, s)) : ((e.lanes & a) !== 0 && (go(e, t), Vl(t, null, null, a), Hl()), s = e.memoizedState, c = t.memoizedState, s.parent !== l ? (s = {
                    parent: l,
                    cache: l
                }, t.memoizedState = s, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = s), xa(t, yt, l)) : (l = c.cache, xa(t, yt, l), l !== s.cache && fo(t, [yt], a, !0))), Nt(e, t, t.pendingProps.children, a), t.child;
            case 29:
                throw t.pendingProps
        }
        throw Error(u(156, t.tag))
    }

    function la(e) {
        e.flags |= 4
    }

    function Wo(e, t, a, l, s) {
        if ((t = (e.mode & 32) !== 0) && (t = !1), t) {
            if (e.flags |= 16777216, (s & 335544128) === s) if (e.stateNode.complete) e.flags |= 8192; else if (Hm()) e.flags |= 8192; else throw ri = tu, yo
        } else e.flags &= -16777217
    }

    function pm(e, t) {
        if (t.type !== "stylesheet" || (t.state.loading & 4) !== 0) e.flags &= -16777217; else if (e.flags |= 16777216, !wp(t)) if (Hm()) e.flags |= 8192; else throw ri = tu, yo
    }

    function gu(e, t) {
        t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag !== 22 ? Xf() : 536870912, e.lanes |= t, Wi |= t)
    }

    function Xl(e, t) {
        if (!Me) switch (e.tailMode) {
            case"hidden":
                t = e.tail;
                for (var a = null; t !== null;) t.alternate !== null && (a = t), t = t.sibling;
                a === null ? e.tail = null : a.sibling = null;
                break;
            case"collapsed":
                a = e.tail;
                for (var l = null; a !== null;) a.alternate !== null && (l = a), a = a.sibling;
                l === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : l.sibling = null
        }
    }

    function et(e) {
        var t = e.alternate !== null && e.alternate.child === e.child, a = 0, l = 0;
        if (t) for (var s = e.child; s !== null;) a |= s.lanes | s.childLanes, l |= s.subtreeFlags & 65011712, l |= s.flags & 65011712, s.return = e, s = s.sibling; else for (s = e.child; s !== null;) a |= s.lanes | s.childLanes, l |= s.subtreeFlags, l |= s.flags, s.return = e, s = s.sibling;
        return e.subtreeFlags |= l, e.childLanes = a, t
    }

    function Hb(e, t, a) {
        var l = t.pendingProps;
        switch (ro(t), t.tag) {
            case 16:
            case 15:
            case 0:
            case 11:
            case 7:
            case 8:
            case 12:
            case 9:
            case 14:
                return et(t), null;
            case 1:
                return et(t), null;
            case 3:
                return a = t.stateNode, l = null, e !== null && (l = e.memoizedState.cache), t.memoizedState.cache !== l && (t.flags |= 2048), ta(yt), He(), a.pendingContext && (a.context = a.pendingContext, a.pendingContext = null), (e === null || e.child === null) && (ki(t) ? la(t) : e === null || e.memoizedState.isDehydrated && (t.flags & 256) === 0 || (t.flags |= 1024, so())), et(t), null;
            case 26:
                var s = t.type, c = t.memoizedState;
                return e === null ? (la(t), c !== null ? (et(t), pm(t, c)) : (et(t), Wo(t, s, null, l, a))) : c ? c !== e.memoizedState ? (la(t), et(t), pm(t, c)) : (et(t), t.flags &= -16777217) : (e = e.memoizedProps, e !== l && la(t), et(t), Wo(t, s, e, l, a)), null;
            case 27:
                if (hn(t), a = _e.current, s = t.type, e !== null && t.stateNode != null) e.memoizedProps !== l && la(t); else {
                    if (!l) {
                        if (t.stateNode === null) throw Error(u(166));
                        return et(t), null
                    }
                    e = F.current, ki(t) ? Xd(t) : (e = Ep(s, l, a), t.stateNode = e, la(t))
                }
                return et(t), null;
            case 5:
                if (hn(t), s = t.type, e !== null && t.stateNode != null) e.memoizedProps !== l && la(t); else {
                    if (!l) {
                        if (t.stateNode === null) throw Error(u(166));
                        return et(t), null
                    }
                    if (c = F.current, ki(t)) Xd(t); else {
                        var h = Du(_e.current);
                        switch (c) {
                            case 1:
                                c = h.createElementNS("http://www.w3.org/2000/svg", s);
                                break;
                            case 2:
                                c = h.createElementNS("http://www.w3.org/1998/Math/MathML", s);
                                break;
                            default:
                                switch (s) {
                                    case"svg":
                                        c = h.createElementNS("http://www.w3.org/2000/svg", s);
                                        break;
                                    case"math":
                                        c = h.createElementNS("http://www.w3.org/1998/Math/MathML", s);
                                        break;
                                    case"script":
                                        c = h.createElement("div"), c.innerHTML = "<script><\/script>", c = c.removeChild(c.firstChild);
                                        break;
                                    case"select":
                                        c = typeof l.is == "string" ? h.createElement("select", {is: l.is}) : h.createElement("select"), l.multiple ? c.multiple = !0 : l.size && (c.size = l.size);
                                        break;
                                    default:
                                        c = typeof l.is == "string" ? h.createElement(s, {is: l.is}) : h.createElement(s)
                                }
                        }
                        c[At] = t, c[Yt] = l;
                        e:for (h = t.child; h !== null;) {
                            if (h.tag === 5 || h.tag === 6) c.appendChild(h.stateNode); else if (h.tag !== 4 && h.tag !== 27 && h.child !== null) {
                                h.child.return = h, h = h.child;
                                continue
                            }
                            if (h === t) break e;
                            for (; h.sibling === null;) {
                                if (h.return === null || h.return === t) break e;
                                h = h.return
                            }
                            h.sibling.return = h.return, h = h.sibling
                        }
                        t.stateNode = c;
                        e:switch (Ct(c, s, l), s) {
                            case"button":
                            case"input":
                            case"select":
                            case"textarea":
                                l = !!l.autoFocus;
                                break e;
                            case"img":
                                l = !0;
                                break e;
                            default:
                                l = !1
                        }
                        l && la(t)
                    }
                }
                return et(t), Wo(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, a), null;
            case 6:
                if (e && t.stateNode != null) e.memoizedProps !== l && la(t); else {
                    if (typeof l != "string" && t.stateNode === null) throw Error(u(166));
                    if (e = _e.current, ki(t)) {
                        if (e = t.stateNode, a = t.memoizedProps, l = null, s = Rt, s !== null) switch (s.tag) {
                            case 27:
                            case 5:
                                l = s.memoizedProps
                        }
                        e[At] = t, e = !!(e.nodeValue === a || l !== null && l.suppressHydrationWarning === !0 || fp(e.nodeValue, a)), e || Ea(t, !0)
                    } else e = Du(e).createTextNode(l), e[At] = t, t.stateNode = e
                }
                return et(t), null;
            case 31:
                if (a = t.memoizedState, e === null || e.memoizedState !== null) {
                    if (l = ki(t), a !== null) {
                        if (e === null) {
                            if (!l) throw Error(u(318));
                            if (e = t.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(u(557));
                            e[At] = t
                        } else ti(), (t.flags & 128) === 0 && (t.memoizedState = null), t.flags |= 4;
                        et(t), e = !1
                    } else a = so(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = a), e = !0;
                    if (!e) return t.flags & 256 ? (an(t), t) : (an(t), null);
                    if ((t.flags & 128) !== 0) throw Error(u(558))
                }
                return et(t), null;
            case 13:
                if (l = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
                    if (s = ki(t), l !== null && l.dehydrated !== null) {
                        if (e === null) {
                            if (!s) throw Error(u(318));
                            if (s = t.memoizedState, s = s !== null ? s.dehydrated : null, !s) throw Error(u(317));
                            s[At] = t
                        } else ti(), (t.flags & 128) === 0 && (t.memoizedState = null), t.flags |= 4;
                        et(t), s = !1
                    } else s = so(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = s), s = !0;
                    if (!s) return t.flags & 256 ? (an(t), t) : (an(t), null)
                }
                return an(t), (t.flags & 128) !== 0 ? (t.lanes = a, t) : (a = l !== null, e = e !== null && e.memoizedState !== null, a && (l = t.child, s = null, l.alternate !== null && l.alternate.memoizedState !== null && l.alternate.memoizedState.cachePool !== null && (s = l.alternate.memoizedState.cachePool.pool), c = null, l.memoizedState !== null && l.memoizedState.cachePool !== null && (c = l.memoizedState.cachePool.pool), c !== s && (l.flags |= 2048)), a !== e && a && (t.child.flags |= 8192), gu(t, t.updateQueue), et(t), null);
            case 4:
                return He(), e === null && Sc(t.stateNode.containerInfo), et(t), null;
            case 10:
                return ta(t.type), et(t), null;
            case 19:
                if (k(ht), l = t.memoizedState, l === null) return et(t), null;
                if (s = (t.flags & 128) !== 0, c = l.rendering, c === null) if (s) Xl(l, !1); else {
                    if (ct !== 0 || e !== null && (e.flags & 128) !== 0) for (e = t.child; e !== null;) {
                        if (c = lu(e), c !== null) {
                            for (t.flags |= 128, Xl(l, !1), e = c.updateQueue, t.updateQueue = e, gu(t, e), t.subtreeFlags = 0, e = a, a = t.child; a !== null;) $d(a, e), a = a.sibling;
                            return I(ht, ht.current & 1 | 2), Me && Wn(t, l.treeForkCount), t.child
                        }
                        e = e.sibling
                    }
                    l.tail !== null && $t() > xu && (t.flags |= 128, s = !0, Xl(l, !1), t.lanes = 4194304)
                } else {
                    if (!s) if (e = lu(c), e !== null) {
                        if (t.flags |= 128, s = !0, e = e.updateQueue, t.updateQueue = e, gu(t, e), Xl(l, !0), l.tail === null && l.tailMode === "hidden" && !c.alternate && !Me) return et(t), null
                    } else 2 * $t() - l.renderingStartTime > xu && a !== 536870912 && (t.flags |= 128, s = !0, Xl(l, !1), t.lanes = 4194304);
                    l.isBackwards ? (c.sibling = t.child, t.child = c) : (e = l.last, e !== null ? e.sibling = c : t.child = c, l.last = c)
                }
                return l.tail !== null ? (e = l.tail, l.rendering = e, l.tail = e.sibling, l.renderingStartTime = $t(), e.sibling = null, a = ht.current, I(ht, s ? a & 1 | 2 : a & 1), Me && Wn(t, l.treeForkCount), e) : (et(t), null);
            case 22:
            case 23:
                return an(t), Eo(), l = t.memoizedState !== null, e !== null ? e.memoizedState !== null !== l && (t.flags |= 8192) : l && (t.flags |= 8192), l ? (a & 536870912) !== 0 && (t.flags & 128) === 0 && (et(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : et(t), a = t.updateQueue, a !== null && gu(t, a.retryQueue), a = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (a = e.memoizedState.cachePool.pool), l = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (l = t.memoizedState.cachePool.pool), l !== a && (t.flags |= 2048), e !== null && k(ii), null;
            case 24:
                return a = null, e !== null && (a = e.memoizedState.cache), t.memoizedState.cache !== a && (t.flags |= 2048), ta(yt), et(t), null;
            case 25:
                return null;
            case 30:
                return null
        }
        throw Error(u(156, t.tag))
    }

    function Vb(e, t) {
        switch (ro(t), t.tag) {
            case 1:
                return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
            case 3:
                return ta(yt), He(), e = t.flags, (e & 65536) !== 0 && (e & 128) === 0 ? (t.flags = e & -65537 | 128, t) : null;
            case 26:
            case 27:
            case 5:
                return hn(t), null;
            case 31:
                if (t.memoizedState !== null) {
                    if (an(t), t.alternate === null) throw Error(u(340));
                    ti()
                }
                return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
            case 13:
                if (an(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
                    if (t.alternate === null) throw Error(u(340));
                    ti()
                }
                return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
            case 19:
                return k(ht), null;
            case 4:
                return He(), null;
            case 10:
                return ta(t.type), null;
            case 22:
            case 23:
                return an(t), Eo(), e !== null && k(ii), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
            case 24:
                return ta(yt), null;
            case 25:
                return null;
            default:
                return null
        }
    }

    function ym(e, t) {
        switch (ro(t), t.tag) {
            case 3:
                ta(yt), He();
                break;
            case 26:
            case 27:
            case 5:
                hn(t);
                break;
            case 4:
                He();
                break;
            case 31:
                t.memoizedState !== null && an(t);
                break;
            case 13:
                an(t);
                break;
            case 19:
                k(ht);
                break;
            case 10:
                ta(t.type);
                break;
            case 22:
            case 23:
                an(t), Eo(), e !== null && k(ii);
                break;
            case 24:
                ta(yt)
        }
    }

    function Jl(e, t) {
        try {
            var a = t.updateQueue, l = a !== null ? a.lastEffect : null;
            if (l !== null) {
                var s = l.next;
                a = s;
                do {
                    if ((a.tag & e) === e) {
                        l = void 0;
                        var c = a.create, h = a.inst;
                        l = c(), h.destroy = l
                    }
                    a = a.next
                } while (a !== s)
            }
        } catch (g) {
            Qe(t, t.return, g)
        }
    }

    function Ra(e, t, a) {
        try {
            var l = t.updateQueue, s = l !== null ? l.lastEffect : null;
            if (s !== null) {
                var c = s.next;
                l = c;
                do {
                    if ((l.tag & e) === e) {
                        var h = l.inst, g = h.destroy;
                        if (g !== void 0) {
                            h.destroy = void 0, s = t;
                            var E = a, C = g;
                            try {
                                C()
                            } catch (B) {
                                Qe(s, E, B)
                            }
                        }
                    }
                    l = l.next
                } while (l !== c)
            }
        } catch (B) {
            Qe(t, t.return, B)
        }
    }

    function vm(e) {
        var t = e.updateQueue;
        if (t !== null) {
            var a = e.stateNode;
            try {
                uh(t, a)
            } catch (l) {
                Qe(e, e.return, l)
            }
        }
    }

    function gm(e, t, a) {
        a.props = oi(e.type, e.memoizedProps), a.state = e.memoizedState;
        try {
            a.componentWillUnmount()
        } catch (l) {
            Qe(e, t, l)
        }
    }

    function Kl(e, t) {
        try {
            var a = e.ref;
            if (a !== null) {
                switch (e.tag) {
                    case 26:
                    case 27:
                    case 5:
                        var l = e.stateNode;
                        break;
                    case 30:
                        l = e.stateNode;
                        break;
                    default:
                        l = e.stateNode
                }
                typeof a == "function" ? e.refCleanup = a(l) : a.current = l
            }
        } catch (s) {
            Qe(e, t, s)
        }
    }

    function Vn(e, t) {
        var a = e.ref, l = e.refCleanup;
        if (a !== null) if (typeof l == "function") try {
            l()
        } catch (s) {
            Qe(e, t, s)
        } finally {
            e.refCleanup = null, e = e.alternate, e != null && (e.refCleanup = null)
        } else if (typeof a == "function") try {
            a(null)
        } catch (s) {
            Qe(e, t, s)
        } else a.current = null
    }

    function bm(e) {
        var t = e.type, a = e.memoizedProps, l = e.stateNode;
        try {
            e:switch (t) {
                case"button":
                case"input":
                case"select":
                case"textarea":
                    a.autoFocus && l.focus();
                    break e;
                case"img":
                    a.src ? l.src = a.src : a.srcSet && (l.srcset = a.srcSet)
            }
        } catch (s) {
            Qe(e, e.return, s)
        }
    }

    function ec(e, t, a) {
        try {
            var l = e.stateNode;
            c0(l, e.type, a, t), l[Yt] = t
        } catch (s) {
            Qe(e, e.return, s)
        }
    }

    function _m(e) {
        return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && Za(e.type) || e.tag === 4
    }

    function tc(e) {
        e:for (; ;) {
            for (; e.sibling === null;) {
                if (e.return === null || _m(e.return)) return null;
                e = e.return
            }
            for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18;) {
                if (e.tag === 27 && Za(e.type) || e.flags & 2 || e.child === null || e.tag === 4) continue e;
                e.child.return = e, e = e.child
            }
            if (!(e.flags & 2)) return e.stateNode
        }
    }

    function nc(e, t, a) {
        var l = e.tag;
        if (l === 5 || l === 6) e = e.stateNode, t ? (a.nodeType === 9 ? a.body : a.nodeName === "HTML" ? a.ownerDocument.body : a).insertBefore(e, t) : (t = a.nodeType === 9 ? a.body : a.nodeName === "HTML" ? a.ownerDocument.body : a, t.appendChild(e), a = a._reactRootContainer, a != null || t.onclick !== null || (t.onclick = Kn)); else if (l !== 4 && (l === 27 && Za(e.type) && (a = e.stateNode, t = null), e = e.child, e !== null)) for (nc(e, t, a), e = e.sibling; e !== null;) nc(e, t, a), e = e.sibling
    }

    function bu(e, t, a) {
        var l = e.tag;
        if (l === 5 || l === 6) e = e.stateNode, t ? a.insertBefore(e, t) : a.appendChild(e); else if (l !== 4 && (l === 27 && Za(e.type) && (a = e.stateNode), e = e.child, e !== null)) for (bu(e, t, a), e = e.sibling; e !== null;) bu(e, t, a), e = e.sibling
    }

    function Sm(e) {
        var t = e.stateNode, a = e.memoizedProps;
        try {
            for (var l = e.type, s = t.attributes; s.length;) t.removeAttributeNode(s[0]);
            Ct(t, l, a), t[At] = e, t[Yt] = a
        } catch (c) {
            Qe(e, e.return, c)
        }
    }

    var ra = !1, bt = !1, ac = !1, Em = typeof WeakSet == "function" ? WeakSet : Set, Tt = null;

    function $b(e, t) {
        if (e = e.containerInfo, zc = ku, e = Md(e), Js(e)) {
            if ("selectionStart" in e) var a = {start: e.selectionStart, end: e.selectionEnd}; else e:{
                a = (a = e.ownerDocument) && a.defaultView || window;
                var l = a.getSelection && a.getSelection();
                if (l && l.rangeCount !== 0) {
                    a = l.anchorNode;
                    var s = l.anchorOffset, c = l.focusNode;
                    l = l.focusOffset;
                    try {
                        a.nodeType, c.nodeType
                    } catch {
                        a = null;
                        break e
                    }
                    var h = 0, g = -1, E = -1, C = 0, B = 0, Q = e, M = null;
                    t:for (; ;) {
                        for (var L; Q !== a || s !== 0 && Q.nodeType !== 3 || (g = h + s), Q !== c || l !== 0 && Q.nodeType !== 3 || (E = h + l), Q.nodeType === 3 && (h += Q.nodeValue.length), (L = Q.firstChild) !== null;) M = Q, Q = L;
                        for (; ;) {
                            if (Q === e) break t;
                            if (M === a && ++C === s && (g = h), M === c && ++B === l && (E = h), (L = Q.nextSibling) !== null) break;
                            Q = M, M = Q.parentNode
                        }
                        Q = L
                    }
                    a = g === -1 || E === -1 ? null : {start: g, end: E}
                } else a = null
            }
            a = a || {start: 0, end: 0}
        } else a = null;
        for (Oc = {
            focusedElem: e,
            selectionRange: a
        }, ku = !1, Tt = t; Tt !== null;) if (t = Tt, e = t.child, (t.subtreeFlags & 1028) !== 0 && e !== null) e.return = t, Tt = e; else for (; Tt !== null;) {
            switch (t = Tt, c = t.alternate, e = t.flags, t.tag) {
                case 0:
                    if ((e & 4) !== 0 && (e = t.updateQueue, e = e !== null ? e.events : null, e !== null)) for (a = 0; a < e.length; a++) s = e[a], s.ref.impl = s.nextImpl;
                    break;
                case 11:
                case 15:
                    break;
                case 1:
                    if ((e & 1024) !== 0 && c !== null) {
                        e = void 0, a = t, s = c.memoizedProps, c = c.memoizedState, l = a.stateNode;
                        try {
                            var re = oi(a.type, s);
                            e = l.getSnapshotBeforeUpdate(re, c), l.__reactInternalSnapshotBeforeUpdate = e
                        } catch (ve) {
                            Qe(a, a.return, ve)
                        }
                    }
                    break;
                case 3:
                    if ((e & 1024) !== 0) {
                        if (e = t.stateNode.containerInfo, a = e.nodeType, a === 9) Ac(e); else if (a === 1) switch (e.nodeName) {
                            case"HEAD":
                            case"HTML":
                            case"BODY":
                                Ac(e);
                                break;
                            default:
                                e.textContent = ""
                        }
                    }
                    break;
                case 5:
                case 26:
                case 27:
                case 6:
                case 4:
                case 17:
                    break;
                default:
                    if ((e & 1024) !== 0) throw Error(u(163))
            }
            if (e = t.sibling, e !== null) {
                e.return = t.return, Tt = e;
                break
            }
            Tt = t.return
        }
    }

    function xm(e, t, a) {
        var l = a.flags;
        switch (a.tag) {
            case 0:
            case 11:
            case 15:
                sa(e, a), l & 4 && Jl(5, a);
                break;
            case 1:
                if (sa(e, a), l & 4) if (e = a.stateNode, t === null) try {
                    e.componentDidMount()
                } catch (h) {
                    Qe(a, a.return, h)
                } else {
                    var s = oi(a.type, t.memoizedProps);
                    t = t.memoizedState;
                    try {
                        e.componentDidUpdate(s, t, e.__reactInternalSnapshotBeforeUpdate)
                    } catch (h) {
                        Qe(a, a.return, h)
                    }
                }
                l & 64 && vm(a), l & 512 && Kl(a, a.return);
                break;
            case 3:
                if (sa(e, a), l & 64 && (e = a.updateQueue, e !== null)) {
                    if (t = null, a.child !== null) switch (a.child.tag) {
                        case 27:
                        case 5:
                            t = a.child.stateNode;
                            break;
                        case 1:
                            t = a.child.stateNode
                    }
                    try {
                        uh(e, t)
                    } catch (h) {
                        Qe(a, a.return, h)
                    }
                }
                break;
            case 27:
                t === null && l & 4 && Sm(a);
            case 26:
            case 5:
                sa(e, a), t === null && l & 4 && bm(a), l & 512 && Kl(a, a.return);
                break;
            case 12:
                sa(e, a);
                break;
            case 31:
                sa(e, a), l & 4 && Tm(e, a);
                break;
            case 13:
                sa(e, a), l & 4 && jm(e, a), l & 64 && (e = a.memoizedState, e !== null && (e = e.dehydrated, e !== null && (a = Ib.bind(null, a), g0(e, a))));
                break;
            case 22:
                if (l = a.memoizedState !== null || ra, !l) {
                    t = t !== null && t.memoizedState !== null || bt, s = ra;
                    var c = bt;
                    ra = l, (bt = t) && !c ? oa(e, a, (a.subtreeFlags & 8772) !== 0) : sa(e, a), ra = s, bt = c
                }
                break;
            case 30:
                break;
            default:
                sa(e, a)
        }
    }

    function zm(e) {
        var t = e.alternate;
        t !== null && (e.alternate = null, zm(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && Cs(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null
    }

    var nt = null, Ft = !1;

    function ua(e, t, a) {
        for (a = a.child; a !== null;) Om(e, t, a), a = a.sibling
    }

    function Om(e, t, a) {
        if (ae && typeof ae.onCommitFiberUnmount == "function") try {
            ae.onCommitFiberUnmount(P, a)
        } catch {
        }
        switch (a.tag) {
            case 26:
                bt || Vn(a, t), ua(e, t, a), a.memoizedState ? a.memoizedState.count-- : a.stateNode && (a = a.stateNode, a.parentNode.removeChild(a));
                break;
            case 27:
                bt || Vn(a, t);
                var l = nt, s = Ft;
                Za(a.type) && (nt = a.stateNode, Ft = !1), ua(e, t, a), lr(a.stateNode), nt = l, Ft = s;
                break;
            case 5:
                bt || Vn(a, t);
            case 6:
                if (l = nt, s = Ft, nt = null, ua(e, t, a), nt = l, Ft = s, nt !== null) if (Ft) try {
                    (nt.nodeType === 9 ? nt.body : nt.nodeName === "HTML" ? nt.ownerDocument.body : nt).removeChild(a.stateNode)
                } catch (c) {
                    Qe(a, t, c)
                } else try {
                    nt.removeChild(a.stateNode)
                } catch (c) {
                    Qe(a, t, c)
                }
                break;
            case 18:
                nt !== null && (Ft ? (e = nt, vp(e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, a.stateNode), ul(e)) : vp(nt, a.stateNode));
                break;
            case 4:
                l = nt, s = Ft, nt = a.stateNode.containerInfo, Ft = !0, ua(e, t, a), nt = l, Ft = s;
                break;
            case 0:
            case 11:
            case 14:
            case 15:
                Ra(2, a, t), bt || Ra(4, a, t), ua(e, t, a);
                break;
            case 1:
                bt || (Vn(a, t), l = a.stateNode, typeof l.componentWillUnmount == "function" && gm(a, t, l)), ua(e, t, a);
                break;
            case 21:
                ua(e, t, a);
                break;
            case 22:
                bt = (l = bt) || a.memoizedState !== null, ua(e, t, a), bt = l;
                break;
            default:
                ua(e, t, a)
        }
    }

    function Tm(e, t) {
        if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null))) {
            e = e.dehydrated;
            try {
                ul(e)
            } catch (a) {
                Qe(t, t.return, a)
            }
        }
    }

    function jm(e, t) {
        if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null && (e = e.dehydrated, e !== null)))) try {
            ul(e)
        } catch (a) {
            Qe(t, t.return, a)
        }
    }

    function Qb(e) {
        switch (e.tag) {
            case 31:
            case 13:
            case 19:
                var t = e.stateNode;
                return t === null && (t = e.stateNode = new Em), t;
            case 22:
                return e = e.stateNode, t = e._retryCache, t === null && (t = e._retryCache = new Em), t;
            default:
                throw Error(u(435, e.tag))
        }
    }

    function _u(e, t) {
        var a = Qb(e);
        t.forEach(function (l) {
            if (!a.has(l)) {
                a.add(l);
                var s = Wb.bind(null, e, l);
                l.then(s, s)
            }
        })
    }

    function Xt(e, t) {
        var a = t.deletions;
        if (a !== null) for (var l = 0; l < a.length; l++) {
            var s = a[l], c = e, h = t, g = h;
            e:for (; g !== null;) {
                switch (g.tag) {
                    case 27:
                        if (Za(g.type)) {
                            nt = g.stateNode, Ft = !1;
                            break e
                        }
                        break;
                    case 5:
                        nt = g.stateNode, Ft = !1;
                        break e;
                    case 3:
                    case 4:
                        nt = g.stateNode.containerInfo, Ft = !0;
                        break e
                }
                g = g.return
            }
            if (nt === null) throw Error(u(160));
            Om(c, h, s), nt = null, Ft = !1, c = s.alternate, c !== null && (c.return = null), s.return = null
        }
        if (t.subtreeFlags & 13886) for (t = t.child; t !== null;) Am(t, e), t = t.sibling
    }

    var Nn = null;

    function Am(e, t) {
        var a = e.alternate, l = e.flags;
        switch (e.tag) {
            case 0:
            case 11:
            case 14:
            case 15:
                Xt(t, e), Jt(e), l & 4 && (Ra(3, e, e.return), Jl(3, e), Ra(5, e, e.return));
                break;
            case 1:
                Xt(t, e), Jt(e), l & 512 && (bt || a === null || Vn(a, a.return)), l & 64 && ra && (e = e.updateQueue, e !== null && (l = e.callbacks, l !== null && (a = e.shared.hiddenCallbacks, e.shared.hiddenCallbacks = a === null ? l : a.concat(l))));
                break;
            case 26:
                var s = Nn;
                if (Xt(t, e), Jt(e), l & 512 && (bt || a === null || Vn(a, a.return)), l & 4) {
                    var c = a !== null ? a.memoizedState : null;
                    if (l = e.memoizedState, a === null) if (l === null) if (e.stateNode === null) {
                        e:{
                            l = e.type, a = e.memoizedProps, s = s.ownerDocument || s;
                            t:switch (l) {
                                case"title":
                                    c = s.getElementsByTagName("title")[0], (!c || c[xl] || c[At] || c.namespaceURI === "http://www.w3.org/2000/svg" || c.hasAttribute("itemprop")) && (c = s.createElement(l), s.head.insertBefore(c, s.querySelector("head > title"))), Ct(c, l, a), c[At] = e, Ot(c), l = c;
                                    break e;
                                case"link":
                                    var h = Ap("link", "href", s).get(l + (a.href || ""));
                                    if (h) {
                                        for (var g = 0; g < h.length; g++) if (c = h[g], c.getAttribute("href") === (a.href == null || a.href === "" ? null : a.href) && c.getAttribute("rel") === (a.rel == null ? null : a.rel) && c.getAttribute("title") === (a.title == null ? null : a.title) && c.getAttribute("crossorigin") === (a.crossOrigin == null ? null : a.crossOrigin)) {
                                            h.splice(g, 1);
                                            break t
                                        }
                                    }
                                    c = s.createElement(l), Ct(c, l, a), s.head.appendChild(c);
                                    break;
                                case"meta":
                                    if (h = Ap("meta", "content", s).get(l + (a.content || ""))) {
                                        for (g = 0; g < h.length; g++) if (c = h[g], c.getAttribute("content") === (a.content == null ? null : "" + a.content) && c.getAttribute("name") === (a.name == null ? null : a.name) && c.getAttribute("property") === (a.property == null ? null : a.property) && c.getAttribute("http-equiv") === (a.httpEquiv == null ? null : a.httpEquiv) && c.getAttribute("charset") === (a.charSet == null ? null : a.charSet)) {
                                            h.splice(g, 1);
                                            break t
                                        }
                                    }
                                    c = s.createElement(l), Ct(c, l, a), s.head.appendChild(c);
                                    break;
                                default:
                                    throw Error(u(468, l))
                            }
                            c[At] = e, Ot(c), l = c
                        }
                        e.stateNode = l
                    } else Rp(s, e.type, e.stateNode); else e.stateNode = jp(s, l, e.memoizedProps); else c !== l ? (c === null ? a.stateNode !== null && (a = a.stateNode, a.parentNode.removeChild(a)) : c.count--, l === null ? Rp(s, e.type, e.stateNode) : jp(s, l, e.memoizedProps)) : l === null && e.stateNode !== null && ec(e, e.memoizedProps, a.memoizedProps)
                }
                break;
            case 27:
                Xt(t, e), Jt(e), l & 512 && (bt || a === null || Vn(a, a.return)), a !== null && l & 4 && ec(e, e.memoizedProps, a.memoizedProps);
                break;
            case 5:
                if (Xt(t, e), Jt(e), l & 512 && (bt || a === null || Vn(a, a.return)), e.flags & 32) {
                    s = e.stateNode;
                    try {
                        wi(s, "")
                    } catch (re) {
                        Qe(e, e.return, re)
                    }
                }
                l & 4 && e.stateNode != null && (s = e.memoizedProps, ec(e, s, a !== null ? a.memoizedProps : s)), l & 1024 && (ac = !0);
                break;
            case 6:
                if (Xt(t, e), Jt(e), l & 4) {
                    if (e.stateNode === null) throw Error(u(162));
                    l = e.memoizedProps, a = e.stateNode;
                    try {
                        a.nodeValue = l
                    } catch (re) {
                        Qe(e, e.return, re)
                    }
                }
                break;
            case 3:
                if (Zu = null, s = Nn, Nn = Mu(t.containerInfo), Xt(t, e), Nn = s, Jt(e), l & 4 && a !== null && a.memoizedState.isDehydrated) try {
                    ul(t.containerInfo)
                } catch (re) {
                    Qe(e, e.return, re)
                }
                ac && (ac = !1, Rm(e));
                break;
            case 4:
                l = Nn, Nn = Mu(e.stateNode.containerInfo), Xt(t, e), Jt(e), Nn = l;
                break;
            case 12:
                Xt(t, e), Jt(e);
                break;
            case 31:
                Xt(t, e), Jt(e), l & 4 && (l = e.updateQueue, l !== null && (e.updateQueue = null, _u(e, l)));
                break;
            case 13:
                Xt(t, e), Jt(e), e.child.flags & 8192 && e.memoizedState !== null != (a !== null && a.memoizedState !== null) && (Eu = $t()), l & 4 && (l = e.updateQueue, l !== null && (e.updateQueue = null, _u(e, l)));
                break;
            case 22:
                s = e.memoizedState !== null;
                var E = a !== null && a.memoizedState !== null, C = ra, B = bt;
                if (ra = C || s, bt = B || E, Xt(t, e), bt = B, ra = C, Jt(e), l & 8192) e:for (t = e.stateNode, t._visibility = s ? t._visibility & -2 : t._visibility | 1, s && (a === null || E || ra || bt || ci(e)), a = null, t = e; ;) {
                    if (t.tag === 5 || t.tag === 26) {
                        if (a === null) {
                            E = a = t;
                            try {
                                if (c = E.stateNode, s) h = c.style, typeof h.setProperty == "function" ? h.setProperty("display", "none", "important") : h.display = "none"; else {
                                    g = E.stateNode;
                                    var Q = E.memoizedProps.style,
                                        M = Q != null && Q.hasOwnProperty("display") ? Q.display : null;
                                    g.style.display = M == null || typeof M == "boolean" ? "" : ("" + M).trim()
                                }
                            } catch (re) {
                                Qe(E, E.return, re)
                            }
                        }
                    } else if (t.tag === 6) {
                        if (a === null) {
                            E = t;
                            try {
                                E.stateNode.nodeValue = s ? "" : E.memoizedProps
                            } catch (re) {
                                Qe(E, E.return, re)
                            }
                        }
                    } else if (t.tag === 18) {
                        if (a === null) {
                            E = t;
                            try {
                                var L = E.stateNode;
                                s ? gp(L, !0) : gp(E.stateNode, !1)
                            } catch (re) {
                                Qe(E, E.return, re)
                            }
                        }
                    } else if ((t.tag !== 22 && t.tag !== 23 || t.memoizedState === null || t === e) && t.child !== null) {
                        t.child.return = t, t = t.child;
                        continue
                    }
                    if (t === e) break e;
                    for (; t.sibling === null;) {
                        if (t.return === null || t.return === e) break e;
                        a === t && (a = null), t = t.return
                    }
                    a === t && (a = null), t.sibling.return = t.return, t = t.sibling
                }
                l & 4 && (l = e.updateQueue, l !== null && (a = l.retryQueue, a !== null && (l.retryQueue = null, _u(e, a))));
                break;
            case 19:
                Xt(t, e), Jt(e), l & 4 && (l = e.updateQueue, l !== null && (e.updateQueue = null, _u(e, l)));
                break;
            case 30:
                break;
            case 21:
                break;
            default:
                Xt(t, e), Jt(e)
        }
    }

    function Jt(e) {
        var t = e.flags;
        if (t & 2) {
            try {
                for (var a, l = e.return; l !== null;) {
                    if (_m(l)) {
                        a = l;
                        break
                    }
                    l = l.return
                }
                if (a == null) throw Error(u(160));
                switch (a.tag) {
                    case 27:
                        var s = a.stateNode, c = tc(e);
                        bu(e, c, s);
                        break;
                    case 5:
                        var h = a.stateNode;
                        a.flags & 32 && (wi(h, ""), a.flags &= -33);
                        var g = tc(e);
                        bu(e, g, h);
                        break;
                    case 3:
                    case 4:
                        var E = a.stateNode.containerInfo, C = tc(e);
                        nc(e, C, E);
                        break;
                    default:
                        throw Error(u(161))
                }
            } catch (B) {
                Qe(e, e.return, B)
            }
            e.flags &= -3
        }
        t & 4096 && (e.flags &= -4097)
    }

    function Rm(e) {
        if (e.subtreeFlags & 1024) for (e = e.child; e !== null;) {
            var t = e;
            Rm(t), t.tag === 5 && t.flags & 1024 && t.stateNode.reset(), e = e.sibling
        }
    }

    function sa(e, t) {
        if (t.subtreeFlags & 8772) for (t = t.child; t !== null;) xm(e, t.alternate, t), t = t.sibling
    }

    function ci(e) {
        for (e = e.child; e !== null;) {
            var t = e;
            switch (t.tag) {
                case 0:
                case 11:
                case 14:
                case 15:
                    Ra(4, t, t.return), ci(t);
                    break;
                case 1:
                    Vn(t, t.return);
                    var a = t.stateNode;
                    typeof a.componentWillUnmount == "function" && gm(t, t.return, a), ci(t);
                    break;
                case 27:
                    lr(t.stateNode);
                case 26:
                case 5:
                    Vn(t, t.return), ci(t);
                    break;
                case 22:
                    t.memoizedState === null && ci(t);
                    break;
                case 30:
                    ci(t);
                    break;
                default:
                    ci(t)
            }
            e = e.sibling
        }
    }

    function oa(e, t, a) {
        for (a = a && (t.subtreeFlags & 8772) !== 0, t = t.child; t !== null;) {
            var l = t.alternate, s = e, c = t, h = c.flags;
            switch (c.tag) {
                case 0:
                case 11:
                case 15:
                    oa(s, c, a), Jl(4, c);
                    break;
                case 1:
                    if (oa(s, c, a), l = c, s = l.stateNode, typeof s.componentDidMount == "function") try {
                        s.componentDidMount()
                    } catch (C) {
                        Qe(l, l.return, C)
                    }
                    if (l = c, s = l.updateQueue, s !== null) {
                        var g = l.stateNode;
                        try {
                            var E = s.shared.hiddenCallbacks;
                            if (E !== null) for (s.shared.hiddenCallbacks = null, s = 0; s < E.length; s++) rh(E[s], g)
                        } catch (C) {
                            Qe(l, l.return, C)
                        }
                    }
                    a && h & 64 && vm(c), Kl(c, c.return);
                    break;
                case 27:
                    Sm(c);
                case 26:
                case 5:
                    oa(s, c, a), a && l === null && h & 4 && bm(c), Kl(c, c.return);
                    break;
                case 12:
                    oa(s, c, a);
                    break;
                case 31:
                    oa(s, c, a), a && h & 4 && Tm(s, c);
                    break;
                case 13:
                    oa(s, c, a), a && h & 4 && jm(s, c);
                    break;
                case 22:
                    c.memoizedState === null && oa(s, c, a), Kl(c, c.return);
                    break;
                case 30:
                    break;
                default:
                    oa(s, c, a)
            }
            t = t.sibling
        }
    }

    function ic(e, t) {
        var a = null;
        e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (a = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== a && (e != null && e.refCount++, a != null && Zl(a))
    }

    function lc(e, t) {
        e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && Zl(e))
    }

    function Cn(e, t, a, l) {
        if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) wm(e, t, a, l), t = t.sibling
    }

    function wm(e, t, a, l) {
        var s = t.flags;
        switch (t.tag) {
            case 0:
            case 11:
            case 15:
                Cn(e, t, a, l), s & 2048 && Jl(9, t);
                break;
            case 1:
                Cn(e, t, a, l);
                break;
            case 3:
                Cn(e, t, a, l), s & 2048 && (e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && Zl(e)));
                break;
            case 12:
                if (s & 2048) {
                    Cn(e, t, a, l), e = t.stateNode;
                    try {
                        var c = t.memoizedProps, h = c.id, g = c.onPostCommit;
                        typeof g == "function" && g(h, t.alternate === null ? "mount" : "update", e.passiveEffectDuration, -0)
                    } catch (E) {
                        Qe(t, t.return, E)
                    }
                } else Cn(e, t, a, l);
                break;
            case 31:
                Cn(e, t, a, l);
                break;
            case 13:
                Cn(e, t, a, l);
                break;
            case 23:
                break;
            case 22:
                c = t.stateNode, h = t.alternate, t.memoizedState !== null ? c._visibility & 2 ? Cn(e, t, a, l) : Pl(e, t) : c._visibility & 2 ? Cn(e, t, a, l) : (c._visibility |= 2, Ki(e, t, a, l, (t.subtreeFlags & 10256) !== 0 || !1)), s & 2048 && ic(h, t);
                break;
            case 24:
                Cn(e, t, a, l), s & 2048 && lc(t.alternate, t);
                break;
            default:
                Cn(e, t, a, l)
        }
    }

    function Ki(e, t, a, l, s) {
        for (s = s && ((t.subtreeFlags & 10256) !== 0 || !1), t = t.child; t !== null;) {
            var c = e, h = t, g = a, E = l, C = h.flags;
            switch (h.tag) {
                case 0:
                case 11:
                case 15:
                    Ki(c, h, g, E, s), Jl(8, h);
                    break;
                case 23:
                    break;
                case 22:
                    var B = h.stateNode;
                    h.memoizedState !== null ? B._visibility & 2 ? Ki(c, h, g, E, s) : Pl(c, h) : (B._visibility |= 2, Ki(c, h, g, E, s)), s && C & 2048 && ic(h.alternate, h);
                    break;
                case 24:
                    Ki(c, h, g, E, s), s && C & 2048 && lc(h.alternate, h);
                    break;
                default:
                    Ki(c, h, g, E, s)
            }
            t = t.sibling
        }
    }

    function Pl(e, t) {
        if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) {
            var a = e, l = t, s = l.flags;
            switch (l.tag) {
                case 22:
                    Pl(a, l), s & 2048 && ic(l.alternate, l);
                    break;
                case 24:
                    Pl(a, l), s & 2048 && lc(l.alternate, l);
                    break;
                default:
                    Pl(a, l)
            }
            t = t.sibling
        }
    }

    var Il = 8192;

    function Pi(e, t, a) {
        if (e.subtreeFlags & Il) for (e = e.child; e !== null;) Nm(e, t, a), e = e.sibling
    }

    function Nm(e, t, a) {
        switch (e.tag) {
            case 26:
                Pi(e, t, a), e.flags & Il && e.memoizedState !== null && w0(a, Nn, e.memoizedState, e.memoizedProps);
                break;
            case 5:
                Pi(e, t, a);
                break;
            case 3:
            case 4:
                var l = Nn;
                Nn = Mu(e.stateNode.containerInfo), Pi(e, t, a), Nn = l;
                break;
            case 22:
                e.memoizedState === null && (l = e.alternate, l !== null && l.memoizedState !== null ? (l = Il, Il = 16777216, Pi(e, t, a), Il = l) : Pi(e, t, a));
                break;
            default:
                Pi(e, t, a)
        }
    }

    function Cm(e) {
        var t = e.alternate;
        if (t !== null && (e = t.child, e !== null)) {
            t.child = null;
            do t = e.sibling, e.sibling = null, e = t; while (e !== null)
        }
    }

    function Wl(e) {
        var t = e.deletions;
        if ((e.flags & 16) !== 0) {
            if (t !== null) for (var a = 0; a < t.length; a++) {
                var l = t[a];
                Tt = l, Mm(l, e)
            }
            Cm(e)
        }
        if (e.subtreeFlags & 10256) for (e = e.child; e !== null;) Dm(e), e = e.sibling
    }

    function Dm(e) {
        switch (e.tag) {
            case 0:
            case 11:
            case 15:
                Wl(e), e.flags & 2048 && Ra(9, e, e.return);
                break;
            case 3:
                Wl(e);
                break;
            case 12:
                Wl(e);
                break;
            case 22:
                var t = e.stateNode;
                e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3, Su(e)) : Wl(e);
                break;
            default:
                Wl(e)
        }
    }

    function Su(e) {
        var t = e.deletions;
        if ((e.flags & 16) !== 0) {
            if (t !== null) for (var a = 0; a < t.length; a++) {
                var l = t[a];
                Tt = l, Mm(l, e)
            }
            Cm(e)
        }
        for (e = e.child; e !== null;) {
            switch (t = e, t.tag) {
                case 0:
                case 11:
                case 15:
                    Ra(8, t, t.return), Su(t);
                    break;
                case 22:
                    a = t.stateNode, a._visibility & 2 && (a._visibility &= -3, Su(t));
                    break;
                default:
                    Su(t)
            }
            e = e.sibling
        }
    }

    function Mm(e, t) {
        for (; Tt !== null;) {
            var a = Tt;
            switch (a.tag) {
                case 0:
                case 11:
                case 15:
                    Ra(8, a, t);
                    break;
                case 23:
                case 22:
                    if (a.memoizedState !== null && a.memoizedState.cachePool !== null) {
                        var l = a.memoizedState.cachePool.pool;
                        l != null && l.refCount++
                    }
                    break;
                case 24:
                    Zl(a.memoizedState.cache)
            }
            if (l = a.child, l !== null) l.return = a, Tt = l; else e:for (a = e; Tt !== null;) {
                l = Tt;
                var s = l.sibling, c = l.return;
                if (zm(l), l === a) {
                    Tt = null;
                    break e
                }
                if (s !== null) {
                    s.return = c, Tt = s;
                    break e
                }
                Tt = c
            }
        }
    }

    var Yb = {
            getCacheForType: function (e) {
                var t = wt(yt), a = t.data.get(e);
                return a === void 0 && (a = e(), t.data.set(e, a)), a
            }, cacheSignal: function () {
                return wt(yt).controller.signal
            }
        }, Gb = typeof WeakMap == "function" ? WeakMap : Map, Ve = 0, Ke = null, we = null, Ce = 0, $e = 0, ln = null,
        wa = !1, Ii = !1, rc = !1, ca = 0, ct = 0, Na = 0, fi = 0, uc = 0, rn = 0, Wi = 0, er = null, Kt = null,
        sc = !1, Eu = 0, Um = 0, xu = 1 / 0, zu = null, Ca = null, Et = 0, Da = null, el = null, fa = 0, oc = 0,
        cc = null, Zm = null, tr = 0, fc = null;

    function un() {
        return (Ve & 2) !== 0 && Ce !== 0 ? Ce & -Ce : Z.T !== null ? vc() : If()
    }

    function Lm() {
        if (rn === 0) if ((Ce & 536870912) === 0 || Me) {
            var e = qn;
            qn <<= 1, (qn & 3932160) === 0 && (qn = 262144), rn = e
        } else rn = 536870912;
        return e = nn.current, e !== null && (e.flags |= 32), rn
    }

    function Pt(e, t, a) {
        (e === Ke && ($e === 2 || $e === 9) || e.cancelPendingCommit !== null) && (tl(e, 0), Ma(e, Ce, rn, !1)), El(e, a), ((Ve & 2) === 0 || e !== Ke) && (e === Ke && ((Ve & 2) === 0 && (fi |= a), ct === 4 && Ma(e, Ce, rn, !1)), $n(e))
    }

    function qm(e, t, a) {
        if ((Ve & 6) !== 0) throw Error(u(327));
        var l = !a && (t & 127) === 0 && (t & e.expiredLanes) === 0 || va(e, t), s = l ? Jb(e, t) : hc(e, t, !0), c = l;
        do {
            if (s === 0) {
                Ii && !l && Ma(e, t, 0, !1);
                break
            } else {
                if (a = e.current.alternate, c && !Fb(a)) {
                    s = hc(e, t, !1), c = !1;
                    continue
                }
                if (s === 2) {
                    if (c = t, e.errorRecoveryDisabledLanes & c) var h = 0; else h = e.pendingLanes & -536870913, h = h !== 0 ? h : h & 536870912 ? 536870912 : 0;
                    if (h !== 0) {
                        t = h;
                        e:{
                            var g = e;
                            s = er;
                            var E = g.current.memoizedState.isDehydrated;
                            if (E && (tl(g, h).flags |= 256), h = hc(g, h, !1), h !== 2) {
                                if (rc && !E) {
                                    g.errorRecoveryDisabledLanes |= c, fi |= c, s = 4;
                                    break e
                                }
                                c = Kt, Kt = s, c !== null && (Kt === null ? Kt = c : Kt.push.apply(Kt, c))
                            }
                            s = h
                        }
                        if (c = !1, s !== 2) continue
                    }
                }
                if (s === 1) {
                    tl(e, 0), Ma(e, t, 0, !0);
                    break
                }
                e:{
                    switch (l = e, c = s, c) {
                        case 0:
                        case 1:
                            throw Error(u(345));
                        case 4:
                            if ((t & 4194048) !== t) break;
                        case 6:
                            Ma(l, t, rn, !wa);
                            break e;
                        case 2:
                            Kt = null;
                            break;
                        case 3:
                        case 5:
                            break;
                        default:
                            throw Error(u(329))
                    }
                    if ((t & 62914560) === t && (s = Eu + 300 - $t(), 10 < s)) {
                        if (Ma(l, t, rn, !wa), xi(l, 0, !0) !== 0) break e;
                        fa = t, l.timeoutHandle = pp(Bm.bind(null, l, a, Kt, zu, sc, t, rn, fi, Wi, wa, c, "Throttled", -0, 0), s);
                        break e
                    }
                    Bm(l, a, Kt, zu, sc, t, rn, fi, Wi, wa, c, null, -0, 0)
                }
            }
            break
        } while (!0);
        $n(e)
    }

    function Bm(e, t, a, l, s, c, h, g, E, C, B, Q, M, L) {
        if (e.timeoutHandle = -1, Q = t.subtreeFlags, Q & 8192 || (Q & 16785408) === 16785408) {
            Q = {
                stylesheets: null,
                count: 0,
                imgCount: 0,
                imgBytes: 0,
                suspenseyImages: [],
                waitingForImages: !0,
                waitingForViewTransition: !1,
                unsuspend: Kn
            }, Nm(t, c, Q);
            var re = (c & 62914560) === c ? Eu - $t() : (c & 4194048) === c ? Um - $t() : 0;
            if (re = N0(Q, re), re !== null) {
                fa = c, e.cancelPendingCommit = re(Fm.bind(null, e, t, c, a, l, s, h, g, E, B, Q, null, M, L)), Ma(e, c, h, !C);
                return
            }
        }
        Fm(e, t, c, a, l, s, h, g, E)
    }

    function Fb(e) {
        for (var t = e; ;) {
            var a = t.tag;
            if ((a === 0 || a === 11 || a === 15) && t.flags & 16384 && (a = t.updateQueue, a !== null && (a = a.stores, a !== null))) for (var l = 0; l < a.length; l++) {
                var s = a[l], c = s.getSnapshot;
                s = s.value;
                try {
                    if (!en(c(), s)) return !1
                } catch {
                    return !1
                }
            }
            if (a = t.child, t.subtreeFlags & 16384 && a !== null) a.return = t, t = a; else {
                if (t === e) break;
                for (; t.sibling === null;) {
                    if (t.return === null || t.return === e) return !0;
                    t = t.return
                }
                t.sibling.return = t.return, t = t.sibling
            }
        }
        return !0
    }

    function Ma(e, t, a, l) {
        t &= ~uc, t &= ~fi, e.suspendedLanes |= t, e.pingedLanes &= ~t, l && (e.warmLanes |= t), l = e.expirationTimes;
        for (var s = t; 0 < s;) {
            var c = 31 - Ze(s), h = 1 << c;
            l[c] = -1, s &= ~h
        }
        a !== 0 && Jf(e, a, t)
    }

    function Ou() {
        return (Ve & 6) === 0 ? (nr(0), !1) : !0
    }

    function dc() {
        if (we !== null) {
            if ($e === 0) var e = we.return; else e = we, ea = ni = null, Ao(e), Yi = null, ql = 0, e = we;
            for (; e !== null;) ym(e.alternate, e), e = e.return;
            we = null
        }
    }

    function tl(e, t) {
        var a = e.timeoutHandle;
        a !== -1 && (e.timeoutHandle = -1, h0(a)), a = e.cancelPendingCommit, a !== null && (e.cancelPendingCommit = null, a()), fa = 0, dc(), Ke = e, we = a = In(e.current, null), Ce = t, $e = 0, ln = null, wa = !1, Ii = va(e, t), rc = !1, Wi = rn = uc = fi = Na = ct = 0, Kt = er = null, sc = !1, (t & 8) !== 0 && (t |= t & 32);
        var l = e.entangledLanes;
        if (l !== 0) for (e = e.entanglements, l &= t; 0 < l;) {
            var s = 31 - Ze(l), c = 1 << s;
            t |= e[s], l &= ~c
        }
        return ca = t, Gr(), a
    }

    function km(e, t) {
        ze = null, Z.H = Gl, t === Qi || t === eu ? (t = nh(), $e = 3) : t === yo ? (t = nh(), $e = 4) : $e = t === Qo ? 8 : t !== null && typeof t == "object" && typeof t.then == "function" ? 6 : 1, ln = t, we === null && (ct = 1, mu(e, vn(t, e.current)))
    }

    function Hm() {
        var e = nn.current;
        return e === null ? !0 : (Ce & 4194048) === Ce ? Sn === null : (Ce & 62914560) === Ce || (Ce & 536870912) !== 0 ? e === Sn : !1
    }

    function Vm() {
        var e = Z.H;
        return Z.H = Gl, e === null ? Gl : e
    }

    function $m() {
        var e = Z.A;
        return Z.A = Yb, e
    }

    function Tu() {
        ct = 4, wa || (Ce & 4194048) !== Ce && nn.current !== null || (Ii = !0), (Na & 134217727) === 0 && (fi & 134217727) === 0 || Ke === null || Ma(Ke, Ce, rn, !1)
    }

    function hc(e, t, a) {
        var l = Ve;
        Ve |= 2;
        var s = Vm(), c = $m();
        (Ke !== e || Ce !== t) && (zu = null, tl(e, t)), t = !1;
        var h = ct;
        e:do try {
            if ($e !== 0 && we !== null) {
                var g = we, E = ln;
                switch ($e) {
                    case 8:
                        dc(), h = 6;
                        break e;
                    case 3:
                    case 2:
                    case 9:
                    case 6:
                        nn.current === null && (t = !0);
                        var C = $e;
                        if ($e = 0, ln = null, nl(e, g, E, C), a && Ii) {
                            h = 0;
                            break e
                        }
                        break;
                    default:
                        C = $e, $e = 0, ln = null, nl(e, g, E, C)
                }
            }
            Xb(), h = ct;
            break
        } catch (B) {
            km(e, B)
        } while (!0);
        return t && e.shellSuspendCounter++, ea = ni = null, Ve = l, Z.H = s, Z.A = c, we === null && (Ke = null, Ce = 0, Gr()), h
    }

    function Xb() {
        for (; we !== null;) Qm(we)
    }

    function Jb(e, t) {
        var a = Ve;
        Ve |= 2;
        var l = Vm(), s = $m();
        Ke !== e || Ce !== t ? (zu = null, xu = $t() + 500, tl(e, t)) : Ii = va(e, t);
        e:do try {
            if ($e !== 0 && we !== null) {
                t = we;
                var c = ln;
                t:switch ($e) {
                    case 1:
                        $e = 0, ln = null, nl(e, t, c, 1);
                        break;
                    case 2:
                    case 9:
                        if (eh(c)) {
                            $e = 0, ln = null, Ym(t);
                            break
                        }
                        t = function () {
                            $e !== 2 && $e !== 9 || Ke !== e || ($e = 7), $n(e)
                        }, c.then(t, t);
                        break e;
                    case 3:
                        $e = 7;
                        break e;
                    case 4:
                        $e = 5;
                        break e;
                    case 7:
                        eh(c) ? ($e = 0, ln = null, Ym(t)) : ($e = 0, ln = null, nl(e, t, c, 7));
                        break;
                    case 5:
                        var h = null;
                        switch (we.tag) {
                            case 26:
                                h = we.memoizedState;
                            case 5:
                            case 27:
                                var g = we;
                                if (h ? wp(h) : g.stateNode.complete) {
                                    $e = 0, ln = null;
                                    var E = g.sibling;
                                    if (E !== null) we = E; else {
                                        var C = g.return;
                                        C !== null ? (we = C, ju(C)) : we = null
                                    }
                                    break t
                                }
                        }
                        $e = 0, ln = null, nl(e, t, c, 5);
                        break;
                    case 6:
                        $e = 0, ln = null, nl(e, t, c, 6);
                        break;
                    case 8:
                        dc(), ct = 6;
                        break e;
                    default:
                        throw Error(u(462))
                }
            }
            Kb();
            break
        } catch (B) {
            km(e, B)
        } while (!0);
        return ea = ni = null, Z.H = l, Z.A = s, Ve = a, we !== null ? 0 : (Ke = null, Ce = 0, Gr(), ct)
    }

    function Kb() {
        for (; we !== null && !Ts();) Qm(we)
    }

    function Qm(e) {
        var t = mm(e.alternate, e, ca);
        e.memoizedProps = e.pendingProps, t === null ? ju(e) : we = t
    }

    function Ym(e) {
        var t = e, a = t.alternate;
        switch (t.tag) {
            case 15:
            case 0:
                t = sm(a, t, t.pendingProps, t.type, void 0, Ce);
                break;
            case 11:
                t = sm(a, t, t.pendingProps, t.type.render, t.ref, Ce);
                break;
            case 5:
                Ao(t);
            default:
                ym(a, t), t = we = $d(t, ca), t = mm(a, t, ca)
        }
        e.memoizedProps = e.pendingProps, t === null ? ju(e) : we = t
    }

    function nl(e, t, a, l) {
        ea = ni = null, Ao(t), Yi = null, ql = 0;
        var s = t.return;
        try {
            if (qb(e, s, t, a, Ce)) {
                ct = 1, mu(e, vn(a, e.current)), we = null;
                return
            }
        } catch (c) {
            if (s !== null) throw we = s, c;
            ct = 1, mu(e, vn(a, e.current)), we = null;
            return
        }
        t.flags & 32768 ? (Me || l === 1 ? e = !0 : Ii || (Ce & 536870912) !== 0 ? e = !1 : (wa = e = !0, (l === 2 || l === 9 || l === 3 || l === 6) && (l = nn.current, l !== null && l.tag === 13 && (l.flags |= 16384))), Gm(t, e)) : ju(t)
    }

    function ju(e) {
        var t = e;
        do {
            if ((t.flags & 32768) !== 0) {
                Gm(t, wa);
                return
            }
            e = t.return;
            var a = Hb(t.alternate, t, ca);
            if (a !== null) {
                we = a;
                return
            }
            if (t = t.sibling, t !== null) {
                we = t;
                return
            }
            we = t = e
        } while (t !== null);
        ct === 0 && (ct = 5)
    }

    function Gm(e, t) {
        do {
            var a = Vb(e.alternate, e);
            if (a !== null) {
                a.flags &= 32767, we = a;
                return
            }
            if (a = e.return, a !== null && (a.flags |= 32768, a.subtreeFlags = 0, a.deletions = null), !t && (e = e.sibling, e !== null)) {
                we = e;
                return
            }
            we = e = a
        } while (e !== null);
        ct = 6, we = null
    }

    function Fm(e, t, a, l, s, c, h, g, E) {
        e.cancelPendingCommit = null;
        do Au(); while (Et !== 0);
        if ((Ve & 6) !== 0) throw Error(u(327));
        if (t !== null) {
            if (t === e.current) throw Error(u(177));
            if (c = t.lanes | t.childLanes, c |= eo, Rg(e, a, c, h, g, E), e === Ke && (we = Ke = null, Ce = 0), el = t, Da = e, fa = a, oc = c, cc = s, Zm = l, (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? (e.callbackNode = null, e.callbackPriority = 0, e0(j, function () {
                return Im(), null
            })) : (e.callbackNode = null, e.callbackPriority = 0), l = (t.flags & 13878) !== 0, (t.subtreeFlags & 13878) !== 0 || l) {
                l = Z.T, Z.T = null, s = K.p, K.p = 2, h = Ve, Ve |= 4;
                try {
                    $b(e, t, a)
                } finally {
                    Ve = h, K.p = s, Z.T = l
                }
            }
            Et = 1, Xm(), Jm(), Km()
        }
    }

    function Xm() {
        if (Et === 1) {
            Et = 0;
            var e = Da, t = el, a = (t.flags & 13878) !== 0;
            if ((t.subtreeFlags & 13878) !== 0 || a) {
                a = Z.T, Z.T = null;
                var l = K.p;
                K.p = 2;
                var s = Ve;
                Ve |= 4;
                try {
                    Am(t, e);
                    var c = Oc, h = Md(e.containerInfo), g = c.focusedElem, E = c.selectionRange;
                    if (h !== g && g && g.ownerDocument && Dd(g.ownerDocument.documentElement, g)) {
                        if (E !== null && Js(g)) {
                            var C = E.start, B = E.end;
                            if (B === void 0 && (B = C), "selectionStart" in g) g.selectionStart = C, g.selectionEnd = Math.min(B, g.value.length); else {
                                var Q = g.ownerDocument || document, M = Q && Q.defaultView || window;
                                if (M.getSelection) {
                                    var L = M.getSelection(), re = g.textContent.length, ve = Math.min(E.start, re),
                                        Fe = E.end === void 0 ? ve : Math.min(E.end, re);
                                    !L.extend && ve > Fe && (h = Fe, Fe = ve, ve = h);
                                    var A = Cd(g, ve), O = Cd(g, Fe);
                                    if (A && O && (L.rangeCount !== 1 || L.anchorNode !== A.node || L.anchorOffset !== A.offset || L.focusNode !== O.node || L.focusOffset !== O.offset)) {
                                        var N = Q.createRange();
                                        N.setStart(A.node, A.offset), L.removeAllRanges(), ve > Fe ? (L.addRange(N), L.extend(O.node, O.offset)) : (N.setEnd(O.node, O.offset), L.addRange(N))
                                    }
                                }
                            }
                        }
                        for (Q = [], L = g; L = L.parentNode;) L.nodeType === 1 && Q.push({
                            element: L,
                            left: L.scrollLeft,
                            top: L.scrollTop
                        });
                        for (typeof g.focus == "function" && g.focus(), g = 0; g < Q.length; g++) {
                            var H = Q[g];
                            H.element.scrollLeft = H.left, H.element.scrollTop = H.top
                        }
                    }
                    ku = !!zc, Oc = zc = null
                } finally {
                    Ve = s, K.p = l, Z.T = a
                }
            }
            e.current = t, Et = 2
        }
    }

    function Jm() {
        if (Et === 2) {
            Et = 0;
            var e = Da, t = el, a = (t.flags & 8772) !== 0;
            if ((t.subtreeFlags & 8772) !== 0 || a) {
                a = Z.T, Z.T = null;
                var l = K.p;
                K.p = 2;
                var s = Ve;
                Ve |= 4;
                try {
                    xm(e, t.alternate, t)
                } finally {
                    Ve = s, K.p = l, Z.T = a
                }
            }
            Et = 3
        }
    }

    function Km() {
        if (Et === 4 || Et === 3) {
            Et = 0, js();
            var e = Da, t = el, a = fa, l = Zm;
            (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? Et = 5 : (Et = 0, el = Da = null, Pm(e, e.pendingLanes));
            var s = e.pendingLanes;
            if (s === 0 && (Ca = null), ws(a), t = t.stateNode, ae && typeof ae.onCommitFiberRoot == "function") try {
                ae.onCommitFiberRoot(P, t, void 0, (t.current.flags & 128) === 128)
            } catch {
            }
            if (l !== null) {
                t = Z.T, s = K.p, K.p = 2, Z.T = null;
                try {
                    for (var c = e.onRecoverableError, h = 0; h < l.length; h++) {
                        var g = l[h];
                        c(g.value, {componentStack: g.stack})
                    }
                } finally {
                    Z.T = t, K.p = s
                }
            }
            (fa & 3) !== 0 && Au(), $n(e), s = e.pendingLanes, (a & 261930) !== 0 && (s & 42) !== 0 ? e === fc ? tr++ : (tr = 0, fc = e) : tr = 0, nr(0)
        }
    }

    function Pm(e, t) {
        (e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache, t != null && (e.pooledCache = null, Zl(t)))
    }

    function Au() {
        return Xm(), Jm(), Km(), Im()
    }

    function Im() {
        if (Et !== 5) return !1;
        var e = Da, t = oc;
        oc = 0;
        var a = ws(fa), l = Z.T, s = K.p;
        try {
            K.p = 32 > a ? 32 : a, Z.T = null, a = cc, cc = null;
            var c = Da, h = fa;
            if (Et = 0, el = Da = null, fa = 0, (Ve & 6) !== 0) throw Error(u(331));
            var g = Ve;
            if (Ve |= 4, Dm(c.current), wm(c, c.current, h, a), Ve = g, nr(0, !1), ae && typeof ae.onPostCommitFiberRoot == "function") try {
                ae.onPostCommitFiberRoot(P, c)
            } catch {
            }
            return !0
        } finally {
            K.p = s, Z.T = l, Pm(e, t)
        }
    }

    function Wm(e, t, a) {
        t = vn(a, t), t = $o(e.stateNode, t, 2), e = Ta(e, t, 2), e !== null && (El(e, 2), $n(e))
    }

    function Qe(e, t, a) {
        if (e.tag === 3) Wm(e, e, a); else for (; t !== null;) {
            if (t.tag === 3) {
                Wm(t, e, a);
                break
            } else if (t.tag === 1) {
                var l = t.stateNode;
                if (typeof t.type.getDerivedStateFromError == "function" || typeof l.componentDidCatch == "function" && (Ca === null || !Ca.has(l))) {
                    e = vn(a, e), a = em(2), l = Ta(t, a, 2), l !== null && (tm(a, l, t, e), El(l, 2), $n(l));
                    break
                }
            }
            t = t.return
        }
    }

    function mc(e, t, a) {
        var l = e.pingCache;
        if (l === null) {
            l = e.pingCache = new Gb;
            var s = new Set;
            l.set(t, s)
        } else s = l.get(t), s === void 0 && (s = new Set, l.set(t, s));
        s.has(a) || (rc = !0, s.add(a), e = Pb.bind(null, e, t, a), t.then(e, e))
    }

    function Pb(e, t, a) {
        var l = e.pingCache;
        l !== null && l.delete(t), e.pingedLanes |= e.suspendedLanes & a, e.warmLanes &= ~a, Ke === e && (Ce & a) === a && (ct === 4 || ct === 3 && (Ce & 62914560) === Ce && 300 > $t() - Eu ? (Ve & 2) === 0 && tl(e, 0) : uc |= a, Wi === Ce && (Wi = 0)), $n(e)
    }

    function ep(e, t) {
        t === 0 && (t = Xf()), e = Wa(e, t), e !== null && (El(e, t), $n(e))
    }

    function Ib(e) {
        var t = e.memoizedState, a = 0;
        t !== null && (a = t.retryLane), ep(e, a)
    }

    function Wb(e, t) {
        var a = 0;
        switch (e.tag) {
            case 31:
            case 13:
                var l = e.stateNode, s = e.memoizedState;
                s !== null && (a = s.retryLane);
                break;
            case 19:
                l = e.stateNode;
                break;
            case 22:
                l = e.stateNode._retryCache;
                break;
            default:
                throw Error(u(314))
        }
        l !== null && l.delete(t), ep(e, a)
    }

    function e0(e, t) {
        return _i(e, t)
    }

    var Ru = null, al = null, pc = !1, wu = !1, yc = !1, Ua = 0;

    function $n(e) {
        e !== al && e.next === null && (al === null ? Ru = al = e : al = al.next = e), wu = !0, pc || (pc = !0, n0())
    }

    function nr(e, t) {
        if (!yc && wu) {
            yc = !0;
            do for (var a = !1, l = Ru; l !== null;) {
                if (e !== 0) {
                    var s = l.pendingLanes;
                    if (s === 0) var c = 0; else {
                        var h = l.suspendedLanes, g = l.pingedLanes;
                        c = (1 << 31 - Ze(42 | e) + 1) - 1, c &= s & ~(h & ~g), c = c & 201326741 ? c & 201326741 | 1 : c ? c | 2 : 0
                    }
                    c !== 0 && (a = !0, ip(l, c))
                } else c = Ce, c = xi(l, l === Ke ? c : 0, l.cancelPendingCommit !== null || l.timeoutHandle !== -1), (c & 3) === 0 || va(l, c) || (a = !0, ip(l, c));
                l = l.next
            } while (a);
            yc = !1
        }
    }

    function t0() {
        tp()
    }

    function tp() {
        wu = pc = !1;
        var e = 0;
        Ua !== 0 && d0() && (e = Ua);
        for (var t = $t(), a = null, l = Ru; l !== null;) {
            var s = l.next, c = np(l, t);
            c === 0 ? (l.next = null, a === null ? Ru = s : a.next = s, s === null && (al = a)) : (a = l, (e !== 0 || (c & 3) !== 0) && (wu = !0)), l = s
        }
        Et !== 0 && Et !== 5 || nr(e), Ua !== 0 && (Ua = 0)
    }

    function np(e, t) {
        for (var a = e.suspendedLanes, l = e.pingedLanes, s = e.expirationTimes, c = e.pendingLanes & -62914561; 0 < c;) {
            var h = 31 - Ze(c), g = 1 << h, E = s[h];
            E === -1 ? ((g & a) === 0 || (g & l) !== 0) && (s[h] = Ag(g, t)) : E <= t && (e.expiredLanes |= g), c &= ~g
        }
        if (t = Ke, a = Ce, a = xi(e, e === t ? a : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), l = e.callbackNode, a === 0 || e === t && ($e === 2 || $e === 9) || e.cancelPendingCommit !== null) return l !== null && l !== null && Si(l), e.callbackNode = null, e.callbackPriority = 0;
        if ((a & 3) === 0 || va(e, a)) {
            if (t = a & -a, t === e.callbackPriority) return t;
            switch (l !== null && Si(l), ws(a)) {
                case 2:
                case 8:
                    a = _;
                    break;
                case 32:
                    a = j;
                    break;
                case 268435456:
                    a = X;
                    break;
                default:
                    a = j
            }
            return l = ap.bind(null, e), a = _i(a, l), e.callbackPriority = t, e.callbackNode = a, t
        }
        return l !== null && l !== null && Si(l), e.callbackPriority = 2, e.callbackNode = null, 2
    }

    function ap(e, t) {
        if (Et !== 0 && Et !== 5) return e.callbackNode = null, e.callbackPriority = 0, null;
        var a = e.callbackNode;
        if (Au() && e.callbackNode !== a) return null;
        var l = Ce;
        return l = xi(e, e === Ke ? l : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), l === 0 ? null : (qm(e, l, t), np(e, $t()), e.callbackNode != null && e.callbackNode === a ? ap.bind(null, e) : null)
    }

    function ip(e, t) {
        if (Au()) return null;
        qm(e, t, !0)
    }

    function n0() {
        m0(function () {
            (Ve & 6) !== 0 ? _i(Sl, t0) : tp()
        })
    }

    function vc() {
        if (Ua === 0) {
            var e = Vi;
            e === 0 && (e = ya, ya <<= 1, (ya & 261888) === 0 && (ya = 256)), Ua = e
        }
        return Ua
    }

    function lp(e) {
        return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : qr("" + e)
    }

    function rp(e, t) {
        var a = t.ownerDocument.createElement("input");
        return a.name = t.name, a.value = t.value, e.id && a.setAttribute("form", e.id), t.parentNode.insertBefore(a, t), e = new FormData(e), a.parentNode.removeChild(a), e
    }

    function a0(e, t, a, l, s) {
        if (t === "submit" && a && a.stateNode === s) {
            var c = lp((s[Yt] || null).action), h = l.submitter;
            h && (t = (t = h[Yt] || null) ? lp(t.formAction) : h.getAttribute("formAction"), t !== null && (c = t, h = null));
            var g = new Vr("action", "action", null, l, s);
            e.push({
                event: g, listeners: [{
                    instance: null, listener: function () {
                        if (l.defaultPrevented) {
                            if (Ua !== 0) {
                                var E = h ? rp(s, h) : new FormData(s);
                                Lo(a, {pending: !0, data: E, method: s.method, action: c}, null, E)
                            }
                        } else typeof c == "function" && (g.preventDefault(), E = h ? rp(s, h) : new FormData(s), Lo(a, {
                            pending: !0,
                            data: E,
                            method: s.method,
                            action: c
                        }, c, E))
                    }, currentTarget: s
                }]
            })
        }
    }

    for (var gc = 0; gc < Ws.length; gc++) {
        var bc = Ws[gc], i0 = bc.toLowerCase(), l0 = bc[0].toUpperCase() + bc.slice(1);
        wn(i0, "on" + l0)
    }
    wn(Ld, "onAnimationEnd"), wn(qd, "onAnimationIteration"), wn(Bd, "onAnimationStart"), wn("dblclick", "onDoubleClick"), wn("focusin", "onFocus"), wn("focusout", "onBlur"), wn(Sb, "onTransitionRun"), wn(Eb, "onTransitionStart"), wn(xb, "onTransitionCancel"), wn(kd, "onTransitionEnd"), Ai("onMouseEnter", ["mouseout", "mouseover"]), Ai("onMouseLeave", ["mouseout", "mouseover"]), Ai("onPointerEnter", ["pointerout", "pointerover"]), Ai("onPointerLeave", ["pointerout", "pointerover"]), Ja("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), Ja("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), Ja("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]), Ja("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), Ja("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), Ja("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
    var ar = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),
        r0 = new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(ar));

    function up(e, t) {
        t = (t & 4) !== 0;
        for (var a = 0; a < e.length; a++) {
            var l = e[a], s = l.event;
            l = l.listeners;
            e:{
                var c = void 0;
                if (t) for (var h = l.length - 1; 0 <= h; h--) {
                    var g = l[h], E = g.instance, C = g.currentTarget;
                    if (g = g.listener, E !== c && s.isPropagationStopped()) break e;
                    c = g, s.currentTarget = C;
                    try {
                        c(s)
                    } catch (B) {
                        Yr(B)
                    }
                    s.currentTarget = null, c = E
                } else for (h = 0; h < l.length; h++) {
                    if (g = l[h], E = g.instance, C = g.currentTarget, g = g.listener, E !== c && s.isPropagationStopped()) break e;
                    c = g, s.currentTarget = C;
                    try {
                        c(s)
                    } catch (B) {
                        Yr(B)
                    }
                    s.currentTarget = null, c = E
                }
            }
        }
    }

    function Ne(e, t) {
        var a = t[Ns];
        a === void 0 && (a = t[Ns] = new Set);
        var l = e + "__bubble";
        a.has(l) || (sp(t, e, 2, !1), a.add(l))
    }

    function _c(e, t, a) {
        var l = 0;
        t && (l |= 4), sp(a, e, l, t)
    }

    var Nu = "_reactListening" + Math.random().toString(36).slice(2);

    function Sc(e) {
        if (!e[Nu]) {
            e[Nu] = !0, td.forEach(function (a) {
                a !== "selectionchange" && (r0.has(a) || _c(a, !1, e), _c(a, !0, e))
            });
            var t = e.nodeType === 9 ? e : e.ownerDocument;
            t === null || t[Nu] || (t[Nu] = !0, _c("selectionchange", !1, t))
        }
    }

    function sp(e, t, a, l) {
        switch (Lp(t)) {
            case 2:
                var s = M0;
                break;
            case 8:
                s = U0;
                break;
            default:
                s = Zc
        }
        a = s.bind(null, t, a, e), s = void 0, !ks || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (s = !0), l ? s !== void 0 ? e.addEventListener(t, a, {
            capture: !0,
            passive: s
        }) : e.addEventListener(t, a, !0) : s !== void 0 ? e.addEventListener(t, a, {passive: s}) : e.addEventListener(t, a, !1)
    }

    function Ec(e, t, a, l, s) {
        var c = l;
        if ((t & 1) === 0 && (t & 2) === 0 && l !== null) e:for (; ;) {
            if (l === null) return;
            var h = l.tag;
            if (h === 3 || h === 4) {
                var g = l.stateNode.containerInfo;
                if (g === s) break;
                if (h === 4) for (h = l.return; h !== null;) {
                    var E = h.tag;
                    if ((E === 3 || E === 4) && h.stateNode.containerInfo === s) return;
                    h = h.return
                }
                for (; g !== null;) {
                    if (h = Oi(g), h === null) return;
                    if (E = h.tag, E === 5 || E === 6 || E === 26 || E === 27) {
                        l = c = h;
                        continue e
                    }
                    g = g.parentNode
                }
            }
            l = l.return
        }
        hd(function () {
            var C = c, B = qs(a), Q = [];
            e:{
                var M = Hd.get(e);
                if (M !== void 0) {
                    var L = Vr, re = e;
                    switch (e) {
                        case"keypress":
                            if (kr(a) === 0) break e;
                        case"keydown":
                        case"keyup":
                            L = Wg;
                            break;
                        case"focusin":
                            re = "focus", L = Qs;
                            break;
                        case"focusout":
                            re = "blur", L = Qs;
                            break;
                        case"beforeblur":
                        case"afterblur":
                            L = Qs;
                            break;
                        case"click":
                            if (a.button === 2) break e;
                        case"auxclick":
                        case"dblclick":
                        case"mousedown":
                        case"mousemove":
                        case"mouseup":
                        case"mouseout":
                        case"mouseover":
                        case"contextmenu":
                            L = yd;
                            break;
                        case"drag":
                        case"dragend":
                        case"dragenter":
                        case"dragexit":
                        case"dragleave":
                        case"dragover":
                        case"dragstart":
                        case"drop":
                            L = Hg;
                            break;
                        case"touchcancel":
                        case"touchend":
                        case"touchmove":
                        case"touchstart":
                            L = nb;
                            break;
                        case Ld:
                        case qd:
                        case Bd:
                            L = Qg;
                            break;
                        case kd:
                            L = ib;
                            break;
                        case"scroll":
                        case"scrollend":
                            L = Bg;
                            break;
                        case"wheel":
                            L = rb;
                            break;
                        case"copy":
                        case"cut":
                        case"paste":
                            L = Gg;
                            break;
                        case"gotpointercapture":
                        case"lostpointercapture":
                        case"pointercancel":
                        case"pointerdown":
                        case"pointermove":
                        case"pointerout":
                        case"pointerover":
                        case"pointerup":
                            L = gd;
                            break;
                        case"toggle":
                        case"beforetoggle":
                            L = sb
                    }
                    var ve = (t & 4) !== 0, Fe = !ve && (e === "scroll" || e === "scrollend"),
                        A = ve ? M !== null ? M + "Capture" : null : M;
                    ve = [];
                    for (var O = C, N; O !== null;) {
                        var H = O;
                        if (N = H.stateNode, H = H.tag, H !== 5 && H !== 26 && H !== 27 || N === null || A === null || (H = Ol(O, A), H != null && ve.push(ir(O, H, N))), Fe) break;
                        O = O.return
                    }
                    0 < ve.length && (M = new L(M, re, null, a, B), Q.push({event: M, listeners: ve}))
                }
            }
            if ((t & 7) === 0) {
                e:{
                    if (M = e === "mouseover" || e === "pointerover", L = e === "mouseout" || e === "pointerout", M && a !== Ls && (re = a.relatedTarget || a.fromElement) && (Oi(re) || re[zi])) break e;
                    if ((L || M) && (M = B.window === B ? B : (M = B.ownerDocument) ? M.defaultView || M.parentWindow : window, L ? (re = a.relatedTarget || a.toElement, L = C, re = re ? Oi(re) : null, re !== null && (Fe = f(re), ve = re.tag, re !== Fe || ve !== 5 && ve !== 27 && ve !== 6) && (re = null)) : (L = null, re = C), L !== re)) {
                        if (ve = yd, H = "onMouseLeave", A = "onMouseEnter", O = "mouse", (e === "pointerout" || e === "pointerover") && (ve = gd, H = "onPointerLeave", A = "onPointerEnter", O = "pointer"), Fe = L == null ? M : zl(L), N = re == null ? M : zl(re), M = new ve(H, O + "leave", L, a, B), M.target = Fe, M.relatedTarget = N, H = null, Oi(B) === C && (ve = new ve(A, O + "enter", re, a, B), ve.target = N, ve.relatedTarget = Fe, H = ve), Fe = H, L && re) t:{
                            for (ve = u0, A = L, O = re, N = 0, H = A; H; H = ve(H)) N++;
                            H = 0;
                            for (var he = O; he; he = ve(he)) H++;
                            for (; 0 < N - H;) A = ve(A), N--;
                            for (; 0 < H - N;) O = ve(O), H--;
                            for (; N--;) {
                                if (A === O || O !== null && A === O.alternate) {
                                    ve = A;
                                    break t
                                }
                                A = ve(A), O = ve(O)
                            }
                            ve = null
                        } else ve = null;
                        L !== null && op(Q, M, L, ve, !1), re !== null && Fe !== null && op(Q, Fe, re, ve, !0)
                    }
                }
                e:{
                    if (M = C ? zl(C) : window, L = M.nodeName && M.nodeName.toLowerCase(), L === "select" || L === "input" && M.type === "file") var Be = Td; else if (zd(M)) if (jd) Be = gb; else {
                        Be = yb;
                        var oe = pb
                    } else L = M.nodeName, !L || L.toLowerCase() !== "input" || M.type !== "checkbox" && M.type !== "radio" ? C && Zs(C.elementType) && (Be = Td) : Be = vb;
                    if (Be && (Be = Be(e, C))) {
                        Od(Q, Be, a, B);
                        break e
                    }
                    oe && oe(e, M, C), e === "focusout" && C && M.type === "number" && C.memoizedProps.value != null && Us(M, "number", M.value)
                }
                switch (oe = C ? zl(C) : window, e) {
                    case"focusin":
                        (zd(oe) || oe.contentEditable === "true") && (Mi = oe, Ks = C, Dl = null);
                        break;
                    case"focusout":
                        Dl = Ks = Mi = null;
                        break;
                    case"mousedown":
                        Ps = !0;
                        break;
                    case"contextmenu":
                    case"mouseup":
                    case"dragend":
                        Ps = !1, Ud(Q, a, B);
                        break;
                    case"selectionchange":
                        if (_b) break;
                    case"keydown":
                    case"keyup":
                        Ud(Q, a, B)
                }
                var Oe;
                if (Gs) e:{
                    switch (e) {
                        case"compositionstart":
                            var De = "onCompositionStart";
                            break e;
                        case"compositionend":
                            De = "onCompositionEnd";
                            break e;
                        case"compositionupdate":
                            De = "onCompositionUpdate";
                            break e
                    }
                    De = void 0
                } else Di ? Ed(e, a) && (De = "onCompositionEnd") : e === "keydown" && a.keyCode === 229 && (De = "onCompositionStart");
                De && (bd && a.locale !== "ko" && (Di || De !== "onCompositionStart" ? De === "onCompositionEnd" && Di && (Oe = md()) : (ba = B, Hs = "value" in ba ? ba.value : ba.textContent, Di = !0)), oe = Cu(C, De), 0 < oe.length && (De = new vd(De, e, null, a, B), Q.push({
                    event: De,
                    listeners: oe
                }), Oe ? De.data = Oe : (Oe = xd(a), Oe !== null && (De.data = Oe)))), (Oe = cb ? fb(e, a) : db(e, a)) && (De = Cu(C, "onBeforeInput"), 0 < De.length && (oe = new vd("onBeforeInput", "beforeinput", null, a, B), Q.push({
                    event: oe,
                    listeners: De
                }), oe.data = Oe)), a0(Q, e, C, a, B)
            }
            up(Q, t)
        })
    }

    function ir(e, t, a) {
        return {instance: e, listener: t, currentTarget: a}
    }

    function Cu(e, t) {
        for (var a = t + "Capture", l = []; e !== null;) {
            var s = e, c = s.stateNode;
            if (s = s.tag, s !== 5 && s !== 26 && s !== 27 || c === null || (s = Ol(e, a), s != null && l.unshift(ir(e, s, c)), s = Ol(e, t), s != null && l.push(ir(e, s, c))), e.tag === 3) return l;
            e = e.return
        }
        return []
    }

    function u0(e) {
        if (e === null) return null;
        do e = e.return; while (e && e.tag !== 5 && e.tag !== 27);
        return e || null
    }

    function op(e, t, a, l, s) {
        for (var c = t._reactName, h = []; a !== null && a !== l;) {
            var g = a, E = g.alternate, C = g.stateNode;
            if (g = g.tag, E !== null && E === l) break;
            g !== 5 && g !== 26 && g !== 27 || C === null || (E = C, s ? (C = Ol(a, c), C != null && h.unshift(ir(a, C, E))) : s || (C = Ol(a, c), C != null && h.push(ir(a, C, E)))), a = a.return
        }
        h.length !== 0 && e.push({event: t, listeners: h})
    }

    var s0 = /\r\n?/g, o0 = /\u0000|\uFFFD/g;

    function cp(e) {
        return (typeof e == "string" ? e : "" + e).replace(s0, `
`).replace(o0, "")
    }

    function fp(e, t) {
        return t = cp(t), cp(e) === t
    }

    function Ge(e, t, a, l, s, c) {
        switch (a) {
            case"children":
                typeof l == "string" ? t === "body" || t === "textarea" && l === "" || wi(e, l) : (typeof l == "number" || typeof l == "bigint") && t !== "body" && wi(e, "" + l);
                break;
            case"className":
                Zr(e, "class", l);
                break;
            case"tabIndex":
                Zr(e, "tabindex", l);
                break;
            case"dir":
            case"role":
            case"viewBox":
            case"width":
            case"height":
                Zr(e, a, l);
                break;
            case"style":
                fd(e, l, c);
                break;
            case"data":
                if (t !== "object") {
                    Zr(e, "data", l);
                    break
                }
            case"src":
            case"href":
                if (l === "" && (t !== "a" || a !== "href")) {
                    e.removeAttribute(a);
                    break
                }
                if (l == null || typeof l == "function" || typeof l == "symbol" || typeof l == "boolean") {
                    e.removeAttribute(a);
                    break
                }
                l = qr("" + l), e.setAttribute(a, l);
                break;
            case"action":
            case"formAction":
                if (typeof l == "function") {
                    e.setAttribute(a, "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");
                    break
                } else typeof c == "function" && (a === "formAction" ? (t !== "input" && Ge(e, t, "name", s.name, s, null), Ge(e, t, "formEncType", s.formEncType, s, null), Ge(e, t, "formMethod", s.formMethod, s, null), Ge(e, t, "formTarget", s.formTarget, s, null)) : (Ge(e, t, "encType", s.encType, s, null), Ge(e, t, "method", s.method, s, null), Ge(e, t, "target", s.target, s, null)));
                if (l == null || typeof l == "symbol" || typeof l == "boolean") {
                    e.removeAttribute(a);
                    break
                }
                l = qr("" + l), e.setAttribute(a, l);
                break;
            case"onClick":
                l != null && (e.onclick = Kn);
                break;
            case"onScroll":
                l != null && Ne("scroll", e);
                break;
            case"onScrollEnd":
                l != null && Ne("scrollend", e);
                break;
            case"dangerouslySetInnerHTML":
                if (l != null) {
                    if (typeof l != "object" || !("__html" in l)) throw Error(u(61));
                    if (a = l.__html, a != null) {
                        if (s.children != null) throw Error(u(60));
                        e.innerHTML = a
                    }
                }
                break;
            case"multiple":
                e.multiple = l && typeof l != "function" && typeof l != "symbol";
                break;
            case"muted":
                e.muted = l && typeof l != "function" && typeof l != "symbol";
                break;
            case"suppressContentEditableWarning":
            case"suppressHydrationWarning":
            case"defaultValue":
            case"defaultChecked":
            case"innerHTML":
            case"ref":
                break;
            case"autoFocus":
                break;
            case"xlinkHref":
                if (l == null || typeof l == "function" || typeof l == "boolean" || typeof l == "symbol") {
                    e.removeAttribute("xlink:href");
                    break
                }
                a = qr("" + l), e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", a);
                break;
            case"contentEditable":
            case"spellCheck":
            case"draggable":
            case"value":
            case"autoReverse":
            case"externalResourcesRequired":
            case"focusable":
            case"preserveAlpha":
                l != null && typeof l != "function" && typeof l != "symbol" ? e.setAttribute(a, "" + l) : e.removeAttribute(a);
                break;
            case"inert":
            case"allowFullScreen":
            case"async":
            case"autoPlay":
            case"controls":
            case"default":
            case"defer":
            case"disabled":
            case"disablePictureInPicture":
            case"disableRemotePlayback":
            case"formNoValidate":
            case"hidden":
            case"loop":
            case"noModule":
            case"noValidate":
            case"open":
            case"playsInline":
            case"readOnly":
            case"required":
            case"reversed":
            case"scoped":
            case"seamless":
            case"itemScope":
                l && typeof l != "function" && typeof l != "symbol" ? e.setAttribute(a, "") : e.removeAttribute(a);
                break;
            case"capture":
            case"download":
                l === !0 ? e.setAttribute(a, "") : l !== !1 && l != null && typeof l != "function" && typeof l != "symbol" ? e.setAttribute(a, l) : e.removeAttribute(a);
                break;
            case"cols":
            case"rows":
            case"size":
            case"span":
                l != null && typeof l != "function" && typeof l != "symbol" && !isNaN(l) && 1 <= l ? e.setAttribute(a, l) : e.removeAttribute(a);
                break;
            case"rowSpan":
            case"start":
                l == null || typeof l == "function" || typeof l == "symbol" || isNaN(l) ? e.removeAttribute(a) : e.setAttribute(a, l);
                break;
            case"popover":
                Ne("beforetoggle", e), Ne("toggle", e), Ur(e, "popover", l);
                break;
            case"xlinkActuate":
                Jn(e, "http://www.w3.org/1999/xlink", "xlink:actuate", l);
                break;
            case"xlinkArcrole":
                Jn(e, "http://www.w3.org/1999/xlink", "xlink:arcrole", l);
                break;
            case"xlinkRole":
                Jn(e, "http://www.w3.org/1999/xlink", "xlink:role", l);
                break;
            case"xlinkShow":
                Jn(e, "http://www.w3.org/1999/xlink", "xlink:show", l);
                break;
            case"xlinkTitle":
                Jn(e, "http://www.w3.org/1999/xlink", "xlink:title", l);
                break;
            case"xlinkType":
                Jn(e, "http://www.w3.org/1999/xlink", "xlink:type", l);
                break;
            case"xmlBase":
                Jn(e, "http://www.w3.org/XML/1998/namespace", "xml:base", l);
                break;
            case"xmlLang":
                Jn(e, "http://www.w3.org/XML/1998/namespace", "xml:lang", l);
                break;
            case"xmlSpace":
                Jn(e, "http://www.w3.org/XML/1998/namespace", "xml:space", l);
                break;
            case"is":
                Ur(e, "is", l);
                break;
            case"innerText":
            case"textContent":
                break;
            default:
                (!(2 < a.length) || a[0] !== "o" && a[0] !== "O" || a[1] !== "n" && a[1] !== "N") && (a = Lg.get(a) || a, Ur(e, a, l))
        }
    }

    function xc(e, t, a, l, s, c) {
        switch (a) {
            case"style":
                fd(e, l, c);
                break;
            case"dangerouslySetInnerHTML":
                if (l != null) {
                    if (typeof l != "object" || !("__html" in l)) throw Error(u(61));
                    if (a = l.__html, a != null) {
                        if (s.children != null) throw Error(u(60));
                        e.innerHTML = a
                    }
                }
                break;
            case"children":
                typeof l == "string" ? wi(e, l) : (typeof l == "number" || typeof l == "bigint") && wi(e, "" + l);
                break;
            case"onScroll":
                l != null && Ne("scroll", e);
                break;
            case"onScrollEnd":
                l != null && Ne("scrollend", e);
                break;
            case"onClick":
                l != null && (e.onclick = Kn);
                break;
            case"suppressContentEditableWarning":
            case"suppressHydrationWarning":
            case"innerHTML":
            case"ref":
                break;
            case"innerText":
            case"textContent":
                break;
            default:
                if (!nd.hasOwnProperty(a)) e:{
                    if (a[0] === "o" && a[1] === "n" && (s = a.endsWith("Capture"), t = a.slice(2, s ? a.length - 7 : void 0), c = e[Yt] || null, c = c != null ? c[a] : null, typeof c == "function" && e.removeEventListener(t, c, s), typeof l == "function")) {
                        typeof c != "function" && c !== null && (a in e ? e[a] = null : e.hasAttribute(a) && e.removeAttribute(a)), e.addEventListener(t, l, s);
                        break e
                    }
                    a in e ? e[a] = l : l === !0 ? e.setAttribute(a, "") : Ur(e, a, l)
                }
        }
    }

    function Ct(e, t, a) {
        switch (t) {
            case"div":
            case"span":
            case"svg":
            case"path":
            case"a":
            case"g":
            case"p":
            case"li":
                break;
            case"img":
                Ne("error", e), Ne("load", e);
                var l = !1, s = !1, c;
                for (c in a) if (a.hasOwnProperty(c)) {
                    var h = a[c];
                    if (h != null) switch (c) {
                        case"src":
                            l = !0;
                            break;
                        case"srcSet":
                            s = !0;
                            break;
                        case"children":
                        case"dangerouslySetInnerHTML":
                            throw Error(u(137, t));
                        default:
                            Ge(e, t, c, h, a, null)
                    }
                }
                s && Ge(e, t, "srcSet", a.srcSet, a, null), l && Ge(e, t, "src", a.src, a, null);
                return;
            case"input":
                Ne("invalid", e);
                var g = c = h = s = null, E = null, C = null;
                for (l in a) if (a.hasOwnProperty(l)) {
                    var B = a[l];
                    if (B != null) switch (l) {
                        case"name":
                            s = B;
                            break;
                        case"type":
                            h = B;
                            break;
                        case"checked":
                            E = B;
                            break;
                        case"defaultChecked":
                            C = B;
                            break;
                        case"value":
                            c = B;
                            break;
                        case"defaultValue":
                            g = B;
                            break;
                        case"children":
                        case"dangerouslySetInnerHTML":
                            if (B != null) throw Error(u(137, t));
                            break;
                        default:
                            Ge(e, t, l, B, a, null)
                    }
                }
                ud(e, c, g, E, C, h, s, !1);
                return;
            case"select":
                Ne("invalid", e), l = h = c = null;
                for (s in a) if (a.hasOwnProperty(s) && (g = a[s], g != null)) switch (s) {
                    case"value":
                        c = g;
                        break;
                    case"defaultValue":
                        h = g;
                        break;
                    case"multiple":
                        l = g;
                    default:
                        Ge(e, t, s, g, a, null)
                }
                t = c, a = h, e.multiple = !!l, t != null ? Ri(e, !!l, t, !1) : a != null && Ri(e, !!l, a, !0);
                return;
            case"textarea":
                Ne("invalid", e), c = s = l = null;
                for (h in a) if (a.hasOwnProperty(h) && (g = a[h], g != null)) switch (h) {
                    case"value":
                        l = g;
                        break;
                    case"defaultValue":
                        s = g;
                        break;
                    case"children":
                        c = g;
                        break;
                    case"dangerouslySetInnerHTML":
                        if (g != null) throw Error(u(91));
                        break;
                    default:
                        Ge(e, t, h, g, a, null)
                }
                od(e, l, s, c);
                return;
            case"option":
                for (E in a) a.hasOwnProperty(E) && (l = a[E], l != null) && (E === "selected" ? e.selected = l && typeof l != "function" && typeof l != "symbol" : Ge(e, t, E, l, a, null));
                return;
            case"dialog":
                Ne("beforetoggle", e), Ne("toggle", e), Ne("cancel", e), Ne("close", e);
                break;
            case"iframe":
            case"object":
                Ne("load", e);
                break;
            case"video":
            case"audio":
                for (l = 0; l < ar.length; l++) Ne(ar[l], e);
                break;
            case"image":
                Ne("error", e), Ne("load", e);
                break;
            case"details":
                Ne("toggle", e);
                break;
            case"embed":
            case"source":
            case"link":
                Ne("error", e), Ne("load", e);
            case"area":
            case"base":
            case"br":
            case"col":
            case"hr":
            case"keygen":
            case"meta":
            case"param":
            case"track":
            case"wbr":
            case"menuitem":
                for (C in a) if (a.hasOwnProperty(C) && (l = a[C], l != null)) switch (C) {
                    case"children":
                    case"dangerouslySetInnerHTML":
                        throw Error(u(137, t));
                    default:
                        Ge(e, t, C, l, a, null)
                }
                return;
            default:
                if (Zs(t)) {
                    for (B in a) a.hasOwnProperty(B) && (l = a[B], l !== void 0 && xc(e, t, B, l, a, void 0));
                    return
                }
        }
        for (g in a) a.hasOwnProperty(g) && (l = a[g], l != null && Ge(e, t, g, l, a, null))
    }

    function c0(e, t, a, l) {
        switch (t) {
            case"div":
            case"span":
            case"svg":
            case"path":
            case"a":
            case"g":
            case"p":
            case"li":
                break;
            case"input":
                var s = null, c = null, h = null, g = null, E = null, C = null, B = null;
                for (L in a) {
                    var Q = a[L];
                    if (a.hasOwnProperty(L) && Q != null) switch (L) {
                        case"checked":
                            break;
                        case"value":
                            break;
                        case"defaultValue":
                            E = Q;
                        default:
                            l.hasOwnProperty(L) || Ge(e, t, L, null, l, Q)
                    }
                }
                for (var M in l) {
                    var L = l[M];
                    if (Q = a[M], l.hasOwnProperty(M) && (L != null || Q != null)) switch (M) {
                        case"type":
                            c = L;
                            break;
                        case"name":
                            s = L;
                            break;
                        case"checked":
                            C = L;
                            break;
                        case"defaultChecked":
                            B = L;
                            break;
                        case"value":
                            h = L;
                            break;
                        case"defaultValue":
                            g = L;
                            break;
                        case"children":
                        case"dangerouslySetInnerHTML":
                            if (L != null) throw Error(u(137, t));
                            break;
                        default:
                            L !== Q && Ge(e, t, M, L, l, Q)
                    }
                }
                Ms(e, h, g, E, C, B, c, s);
                return;
            case"select":
                L = h = g = M = null;
                for (c in a) if (E = a[c], a.hasOwnProperty(c) && E != null) switch (c) {
                    case"value":
                        break;
                    case"multiple":
                        L = E;
                    default:
                        l.hasOwnProperty(c) || Ge(e, t, c, null, l, E)
                }
                for (s in l) if (c = l[s], E = a[s], l.hasOwnProperty(s) && (c != null || E != null)) switch (s) {
                    case"value":
                        M = c;
                        break;
                    case"defaultValue":
                        g = c;
                        break;
                    case"multiple":
                        h = c;
                    default:
                        c !== E && Ge(e, t, s, c, l, E)
                }
                t = g, a = h, l = L, M != null ? Ri(e, !!a, M, !1) : !!l != !!a && (t != null ? Ri(e, !!a, t, !0) : Ri(e, !!a, a ? [] : "", !1));
                return;
            case"textarea":
                L = M = null;
                for (g in a) if (s = a[g], a.hasOwnProperty(g) && s != null && !l.hasOwnProperty(g)) switch (g) {
                    case"value":
                        break;
                    case"children":
                        break;
                    default:
                        Ge(e, t, g, null, l, s)
                }
                for (h in l) if (s = l[h], c = a[h], l.hasOwnProperty(h) && (s != null || c != null)) switch (h) {
                    case"value":
                        M = s;
                        break;
                    case"defaultValue":
                        L = s;
                        break;
                    case"children":
                        break;
                    case"dangerouslySetInnerHTML":
                        if (s != null) throw Error(u(91));
                        break;
                    default:
                        s !== c && Ge(e, t, h, s, l, c)
                }
                sd(e, M, L);
                return;
            case"option":
                for (var re in a) M = a[re], a.hasOwnProperty(re) && M != null && !l.hasOwnProperty(re) && (re === "selected" ? e.selected = !1 : Ge(e, t, re, null, l, M));
                for (E in l) M = l[E], L = a[E], l.hasOwnProperty(E) && M !== L && (M != null || L != null) && (E === "selected" ? e.selected = M && typeof M != "function" && typeof M != "symbol" : Ge(e, t, E, M, l, L));
                return;
            case"img":
            case"link":
            case"area":
            case"base":
            case"br":
            case"col":
            case"embed":
            case"hr":
            case"keygen":
            case"meta":
            case"param":
            case"source":
            case"track":
            case"wbr":
            case"menuitem":
                for (var ve in a) M = a[ve], a.hasOwnProperty(ve) && M != null && !l.hasOwnProperty(ve) && Ge(e, t, ve, null, l, M);
                for (C in l) if (M = l[C], L = a[C], l.hasOwnProperty(C) && M !== L && (M != null || L != null)) switch (C) {
                    case"children":
                    case"dangerouslySetInnerHTML":
                        if (M != null) throw Error(u(137, t));
                        break;
                    default:
                        Ge(e, t, C, M, l, L)
                }
                return;
            default:
                if (Zs(t)) {
                    for (var Fe in a) M = a[Fe], a.hasOwnProperty(Fe) && M !== void 0 && !l.hasOwnProperty(Fe) && xc(e, t, Fe, void 0, l, M);
                    for (B in l) M = l[B], L = a[B], !l.hasOwnProperty(B) || M === L || M === void 0 && L === void 0 || xc(e, t, B, M, l, L);
                    return
                }
        }
        for (var A in a) M = a[A], a.hasOwnProperty(A) && M != null && !l.hasOwnProperty(A) && Ge(e, t, A, null, l, M);
        for (Q in l) M = l[Q], L = a[Q], !l.hasOwnProperty(Q) || M === L || M == null && L == null || Ge(e, t, Q, M, l, L)
    }

    function dp(e) {
        switch (e) {
            case"css":
            case"script":
            case"font":
            case"img":
            case"image":
            case"input":
            case"link":
                return !0;
            default:
                return !1
        }
    }

    function f0() {
        if (typeof performance.getEntriesByType == "function") {
            for (var e = 0, t = 0, a = performance.getEntriesByType("resource"), l = 0; l < a.length; l++) {
                var s = a[l], c = s.transferSize, h = s.initiatorType, g = s.duration;
                if (c && g && dp(h)) {
                    for (h = 0, g = s.responseEnd, l += 1; l < a.length; l++) {
                        var E = a[l], C = E.startTime;
                        if (C > g) break;
                        var B = E.transferSize, Q = E.initiatorType;
                        B && dp(Q) && (E = E.responseEnd, h += B * (E < g ? 1 : (g - C) / (E - C)))
                    }
                    if (--l, t += 8 * (c + h) / (s.duration / 1e3), e++, 10 < e) break
                }
            }
            if (0 < e) return t / e / 1e6
        }
        return navigator.connection && (e = navigator.connection.downlink, typeof e == "number") ? e : 5
    }

    var zc = null, Oc = null;

    function Du(e) {
        return e.nodeType === 9 ? e : e.ownerDocument
    }

    function hp(e) {
        switch (e) {
            case"http://www.w3.org/2000/svg":
                return 1;
            case"http://www.w3.org/1998/Math/MathML":
                return 2;
            default:
                return 0
        }
    }

    function mp(e, t) {
        if (e === 0) switch (t) {
            case"svg":
                return 1;
            case"math":
                return 2;
            default:
                return 0
        }
        return e === 1 && t === "foreignObject" ? 0 : e
    }

    function Tc(e, t) {
        return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.children == "bigint" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null
    }

    var jc = null;

    function d0() {
        var e = window.event;
        return e && e.type === "popstate" ? e === jc ? !1 : (jc = e, !0) : (jc = null, !1)
    }

    var pp = typeof setTimeout == "function" ? setTimeout : void 0,
        h0 = typeof clearTimeout == "function" ? clearTimeout : void 0,
        yp = typeof Promise == "function" ? Promise : void 0,
        m0 = typeof queueMicrotask == "function" ? queueMicrotask : typeof yp < "u" ? function (e) {
            return yp.resolve(null).then(e).catch(p0)
        } : pp;

    function p0(e) {
        setTimeout(function () {
            throw e
        })
    }

    function Za(e) {
        return e === "head"
    }

    function vp(e, t) {
        var a = t, l = 0;
        do {
            var s = a.nextSibling;
            if (e.removeChild(a), s && s.nodeType === 8) if (a = s.data, a === "/$" || a === "/&") {
                if (l === 0) {
                    e.removeChild(s), ul(t);
                    return
                }
                l--
            } else if (a === "$" || a === "$?" || a === "$~" || a === "$!" || a === "&") l++; else if (a === "html") lr(e.ownerDocument.documentElement); else if (a === "head") {
                a = e.ownerDocument.head, lr(a);
                for (var c = a.firstChild; c;) {
                    var h = c.nextSibling, g = c.nodeName;
                    c[xl] || g === "SCRIPT" || g === "STYLE" || g === "LINK" && c.rel.toLowerCase() === "stylesheet" || a.removeChild(c), c = h
                }
            } else a === "body" && lr(e.ownerDocument.body);
            a = s
        } while (a);
        ul(t)
    }

    function gp(e, t) {
        var a = e;
        e = 0;
        do {
            var l = a.nextSibling;
            if (a.nodeType === 1 ? t ? (a._stashedDisplay = a.style.display, a.style.display = "none") : (a.style.display = a._stashedDisplay || "", a.getAttribute("style") === "" && a.removeAttribute("style")) : a.nodeType === 3 && (t ? (a._stashedText = a.nodeValue, a.nodeValue = "") : a.nodeValue = a._stashedText || ""), l && l.nodeType === 8) if (a = l.data, a === "/$") {
                if (e === 0) break;
                e--
            } else a !== "$" && a !== "$?" && a !== "$~" && a !== "$!" || e++;
            a = l
        } while (a)
    }

    function Ac(e) {
        var t = e.firstChild;
        for (t && t.nodeType === 10 && (t = t.nextSibling); t;) {
            var a = t;
            switch (t = t.nextSibling, a.nodeName) {
                case"HTML":
                case"HEAD":
                case"BODY":
                    Ac(a), Cs(a);
                    continue;
                case"SCRIPT":
                case"STYLE":
                    continue;
                case"LINK":
                    if (a.rel.toLowerCase() === "stylesheet") continue
            }
            e.removeChild(a)
        }
    }

    function y0(e, t, a, l) {
        for (; e.nodeType === 1;) {
            var s = a;
            if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
                if (!l && (e.nodeName !== "INPUT" || e.type !== "hidden")) break
            } else if (l) {
                if (!e[xl]) switch (t) {
                    case"meta":
                        if (!e.hasAttribute("itemprop")) break;
                        return e;
                    case"link":
                        if (c = e.getAttribute("rel"), c === "stylesheet" && e.hasAttribute("data-precedence")) break;
                        if (c !== s.rel || e.getAttribute("href") !== (s.href == null || s.href === "" ? null : s.href) || e.getAttribute("crossorigin") !== (s.crossOrigin == null ? null : s.crossOrigin) || e.getAttribute("title") !== (s.title == null ? null : s.title)) break;
                        return e;
                    case"style":
                        if (e.hasAttribute("data-precedence")) break;
                        return e;
                    case"script":
                        if (c = e.getAttribute("src"), (c !== (s.src == null ? null : s.src) || e.getAttribute("type") !== (s.type == null ? null : s.type) || e.getAttribute("crossorigin") !== (s.crossOrigin == null ? null : s.crossOrigin)) && c && e.hasAttribute("async") && !e.hasAttribute("itemprop")) break;
                        return e;
                    default:
                        return e
                }
            } else if (t === "input" && e.type === "hidden") {
                var c = s.name == null ? null : "" + s.name;
                if (s.type === "hidden" && e.getAttribute("name") === c) return e
            } else return e;
            if (e = En(e.nextSibling), e === null) break
        }
        return null
    }

    function v0(e, t, a) {
        if (t === "") return null;
        for (; e.nodeType !== 3;) if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !a || (e = En(e.nextSibling), e === null)) return null;
        return e
    }

    function bp(e, t) {
        for (; e.nodeType !== 8;) if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !t || (e = En(e.nextSibling), e === null)) return null;
        return e
    }

    function Rc(e) {
        return e.data === "$?" || e.data === "$~"
    }

    function wc(e) {
        return e.data === "$!" || e.data === "$?" && e.ownerDocument.readyState !== "loading"
    }

    function g0(e, t) {
        var a = e.ownerDocument;
        if (e.data === "$~") e._reactRetry = t; else if (e.data !== "$?" || a.readyState !== "loading") t(); else {
            var l = function () {
                t(), a.removeEventListener("DOMContentLoaded", l)
            };
            a.addEventListener("DOMContentLoaded", l), e._reactRetry = l
        }
    }

    function En(e) {
        for (; e != null; e = e.nextSibling) {
            var t = e.nodeType;
            if (t === 1 || t === 3) break;
            if (t === 8) {
                if (t = e.data, t === "$" || t === "$!" || t === "$?" || t === "$~" || t === "&" || t === "F!" || t === "F") break;
                if (t === "/$" || t === "/&") return null
            }
        }
        return e
    }

    var Nc = null;

    function _p(e) {
        e = e.nextSibling;
        for (var t = 0; e;) {
            if (e.nodeType === 8) {
                var a = e.data;
                if (a === "/$" || a === "/&") {
                    if (t === 0) return En(e.nextSibling);
                    t--
                } else a !== "$" && a !== "$!" && a !== "$?" && a !== "$~" && a !== "&" || t++
            }
            e = e.nextSibling
        }
        return null
    }

    function Sp(e) {
        e = e.previousSibling;
        for (var t = 0; e;) {
            if (e.nodeType === 8) {
                var a = e.data;
                if (a === "$" || a === "$!" || a === "$?" || a === "$~" || a === "&") {
                    if (t === 0) return e;
                    t--
                } else a !== "/$" && a !== "/&" || t++
            }
            e = e.previousSibling
        }
        return null
    }

    function Ep(e, t, a) {
        switch (t = Du(a), e) {
            case"html":
                if (e = t.documentElement, !e) throw Error(u(452));
                return e;
            case"head":
                if (e = t.head, !e) throw Error(u(453));
                return e;
            case"body":
                if (e = t.body, !e) throw Error(u(454));
                return e;
            default:
                throw Error(u(451))
        }
    }

    function lr(e) {
        for (var t = e.attributes; t.length;) e.removeAttributeNode(t[0]);
        Cs(e)
    }

    var xn = new Map, xp = new Set;

    function Mu(e) {
        return typeof e.getRootNode == "function" ? e.getRootNode() : e.nodeType === 9 ? e : e.ownerDocument
    }

    var da = K.d;
    K.d = {f: b0, r: _0, D: S0, C: E0, L: x0, m: z0, X: T0, S: O0, M: j0};

    function b0() {
        var e = da.f(), t = Ou();
        return e || t
    }

    function _0(e) {
        var t = Ti(e);
        t !== null && t.tag === 5 && t.type === "form" ? kh(t) : da.r(e)
    }

    var il = typeof document > "u" ? null : document;

    function zp(e, t, a) {
        var l = il;
        if (l && typeof t == "string" && t) {
            var s = pn(t);
            s = 'link[rel="' + e + '"][href="' + s + '"]', typeof a == "string" && (s += '[crossorigin="' + a + '"]'), xp.has(s) || (xp.add(s), e = {
                rel: e,
                crossOrigin: a,
                href: t
            }, l.querySelector(s) === null && (t = l.createElement("link"), Ct(t, "link", e), Ot(t), l.head.appendChild(t)))
        }
    }

    function S0(e) {
        da.D(e), zp("dns-prefetch", e, null)
    }

    function E0(e, t) {
        da.C(e, t), zp("preconnect", e, t)
    }

    function x0(e, t, a) {
        da.L(e, t, a);
        var l = il;
        if (l && e && t) {
            var s = 'link[rel="preload"][as="' + pn(t) + '"]';
            t === "image" && a && a.imageSrcSet ? (s += '[imagesrcset="' + pn(a.imageSrcSet) + '"]', typeof a.imageSizes == "string" && (s += '[imagesizes="' + pn(a.imageSizes) + '"]')) : s += '[href="' + pn(e) + '"]';
            var c = s;
            switch (t) {
                case"style":
                    c = ll(e);
                    break;
                case"script":
                    c = rl(e)
            }
            xn.has(c) || (e = S({
                rel: "preload",
                href: t === "image" && a && a.imageSrcSet ? void 0 : e,
                as: t
            }, a), xn.set(c, e), l.querySelector(s) !== null || t === "style" && l.querySelector(rr(c)) || t === "script" && l.querySelector(ur(c)) || (t = l.createElement("link"), Ct(t, "link", e), Ot(t), l.head.appendChild(t)))
        }
    }

    function z0(e, t) {
        da.m(e, t);
        var a = il;
        if (a && e) {
            var l = t && typeof t.as == "string" ? t.as : "script",
                s = 'link[rel="modulepreload"][as="' + pn(l) + '"][href="' + pn(e) + '"]', c = s;
            switch (l) {
                case"audioworklet":
                case"paintworklet":
                case"serviceworker":
                case"sharedworker":
                case"worker":
                case"script":
                    c = rl(e)
            }
            if (!xn.has(c) && (e = S({rel: "modulepreload", href: e}, t), xn.set(c, e), a.querySelector(s) === null)) {
                switch (l) {
                    case"audioworklet":
                    case"paintworklet":
                    case"serviceworker":
                    case"sharedworker":
                    case"worker":
                    case"script":
                        if (a.querySelector(ur(c))) return
                }
                l = a.createElement("link"), Ct(l, "link", e), Ot(l), a.head.appendChild(l)
            }
        }
    }

    function O0(e, t, a) {
        da.S(e, t, a);
        var l = il;
        if (l && e) {
            var s = ji(l).hoistableStyles, c = ll(e);
            t = t || "default";
            var h = s.get(c);
            if (!h) {
                var g = {loading: 0, preload: null};
                if (h = l.querySelector(rr(c))) g.loading = 5; else {
                    e = S({rel: "stylesheet", href: e, "data-precedence": t}, a), (a = xn.get(c)) && Cc(e, a);
                    var E = h = l.createElement("link");
                    Ot(E), Ct(E, "link", e), E._p = new Promise(function (C, B) {
                        E.onload = C, E.onerror = B
                    }), E.addEventListener("load", function () {
                        g.loading |= 1
                    }), E.addEventListener("error", function () {
                        g.loading |= 2
                    }), g.loading |= 4, Uu(h, t, l)
                }
                h = {type: "stylesheet", instance: h, count: 1, state: g}, s.set(c, h)
            }
        }
    }

    function T0(e, t) {
        da.X(e, t);
        var a = il;
        if (a && e) {
            var l = ji(a).hoistableScripts, s = rl(e), c = l.get(s);
            c || (c = a.querySelector(ur(s)), c || (e = S({
                src: e,
                async: !0
            }, t), (t = xn.get(s)) && Dc(e, t), c = a.createElement("script"), Ot(c), Ct(c, "link", e), a.head.appendChild(c)), c = {
                type: "script",
                instance: c,
                count: 1,
                state: null
            }, l.set(s, c))
        }
    }

    function j0(e, t) {
        da.M(e, t);
        var a = il;
        if (a && e) {
            var l = ji(a).hoistableScripts, s = rl(e), c = l.get(s);
            c || (c = a.querySelector(ur(s)), c || (e = S({
                src: e,
                async: !0,
                type: "module"
            }, t), (t = xn.get(s)) && Dc(e, t), c = a.createElement("script"), Ot(c), Ct(c, "link", e), a.head.appendChild(c)), c = {
                type: "script",
                instance: c,
                count: 1,
                state: null
            }, l.set(s, c))
        }
    }

    function Op(e, t, a, l) {
        var s = (s = _e.current) ? Mu(s) : null;
        if (!s) throw Error(u(446));
        switch (e) {
            case"meta":
            case"title":
                return null;
            case"style":
                return typeof a.precedence == "string" && typeof a.href == "string" ? (t = ll(a.href), a = ji(s).hoistableStyles, l = a.get(t), l || (l = {
                    type: "style",
                    instance: null,
                    count: 0,
                    state: null
                }, a.set(t, l)), l) : {type: "void", instance: null, count: 0, state: null};
            case"link":
                if (a.rel === "stylesheet" && typeof a.href == "string" && typeof a.precedence == "string") {
                    e = ll(a.href);
                    var c = ji(s).hoistableStyles, h = c.get(e);
                    if (h || (s = s.ownerDocument || s, h = {
                        type: "stylesheet",
                        instance: null,
                        count: 0,
                        state: {loading: 0, preload: null}
                    }, c.set(e, h), (c = s.querySelector(rr(e))) && !c._p && (h.instance = c, h.state.loading = 5), xn.has(e) || (a = {
                        rel: "preload",
                        as: "style",
                        href: a.href,
                        crossOrigin: a.crossOrigin,
                        integrity: a.integrity,
                        media: a.media,
                        hrefLang: a.hrefLang,
                        referrerPolicy: a.referrerPolicy
                    }, xn.set(e, a), c || A0(s, e, a, h.state))), t && l === null) throw Error(u(528, ""));
                    return h
                }
                if (t && l !== null) throw Error(u(529, ""));
                return null;
            case"script":
                return t = a.async, a = a.src, typeof a == "string" && t && typeof t != "function" && typeof t != "symbol" ? (t = rl(a), a = ji(s).hoistableScripts, l = a.get(t), l || (l = {
                    type: "script",
                    instance: null,
                    count: 0,
                    state: null
                }, a.set(t, l)), l) : {type: "void", instance: null, count: 0, state: null};
            default:
                throw Error(u(444, e))
        }
    }

    function ll(e) {
        return 'href="' + pn(e) + '"'
    }

    function rr(e) {
        return 'link[rel="stylesheet"][' + e + "]"
    }

    function Tp(e) {
        return S({}, e, {"data-precedence": e.precedence, precedence: null})
    }

    function A0(e, t, a, l) {
        e.querySelector('link[rel="preload"][as="style"][' + t + "]") ? l.loading = 1 : (t = e.createElement("link"), l.preload = t, t.addEventListener("load", function () {
            return l.loading |= 1
        }), t.addEventListener("error", function () {
            return l.loading |= 2
        }), Ct(t, "link", a), Ot(t), e.head.appendChild(t))
    }

    function rl(e) {
        return '[src="' + pn(e) + '"]'
    }

    function ur(e) {
        return "script[async]" + e
    }

    function jp(e, t, a) {
        if (t.count++, t.instance === null) switch (t.type) {
            case"style":
                var l = e.querySelector('style[data-href~="' + pn(a.href) + '"]');
                if (l) return t.instance = l, Ot(l), l;
                var s = S({}, a, {"data-href": a.href, "data-precedence": a.precedence, href: null, precedence: null});
                return l = (e.ownerDocument || e).createElement("style"), Ot(l), Ct(l, "style", s), Uu(l, a.precedence, e), t.instance = l;
            case"stylesheet":
                s = ll(a.href);
                var c = e.querySelector(rr(s));
                if (c) return t.state.loading |= 4, t.instance = c, Ot(c), c;
                l = Tp(a), (s = xn.get(s)) && Cc(l, s), c = (e.ownerDocument || e).createElement("link"), Ot(c);
                var h = c;
                return h._p = new Promise(function (g, E) {
                    h.onload = g, h.onerror = E
                }), Ct(c, "link", l), t.state.loading |= 4, Uu(c, a.precedence, e), t.instance = c;
            case"script":
                return c = rl(a.src), (s = e.querySelector(ur(c))) ? (t.instance = s, Ot(s), s) : (l = a, (s = xn.get(c)) && (l = S({}, a), Dc(l, s)), e = e.ownerDocument || e, s = e.createElement("script"), Ot(s), Ct(s, "link", l), e.head.appendChild(s), t.instance = s);
            case"void":
                return null;
            default:
                throw Error(u(443, t.type))
        } else t.type === "stylesheet" && (t.state.loading & 4) === 0 && (l = t.instance, t.state.loading |= 4, Uu(l, a.precedence, e));
        return t.instance
    }

    function Uu(e, t, a) {
        for (var l = a.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'), s = l.length ? l[l.length - 1] : null, c = s, h = 0; h < l.length; h++) {
            var g = l[h];
            if (g.dataset.precedence === t) c = g; else if (c !== s) break
        }
        c ? c.parentNode.insertBefore(e, c.nextSibling) : (t = a.nodeType === 9 ? a.head : a, t.insertBefore(e, t.firstChild))
    }

    function Cc(e, t) {
        e.crossOrigin == null && (e.crossOrigin = t.crossOrigin), e.referrerPolicy == null && (e.referrerPolicy = t.referrerPolicy), e.title == null && (e.title = t.title)
    }

    function Dc(e, t) {
        e.crossOrigin == null && (e.crossOrigin = t.crossOrigin), e.referrerPolicy == null && (e.referrerPolicy = t.referrerPolicy), e.integrity == null && (e.integrity = t.integrity)
    }

    var Zu = null;

    function Ap(e, t, a) {
        if (Zu === null) {
            var l = new Map, s = Zu = new Map;
            s.set(a, l)
        } else s = Zu, l = s.get(a), l || (l = new Map, s.set(a, l));
        if (l.has(e)) return l;
        for (l.set(e, null), a = a.getElementsByTagName(e), s = 0; s < a.length; s++) {
            var c = a[s];
            if (!(c[xl] || c[At] || e === "link" && c.getAttribute("rel") === "stylesheet") && c.namespaceURI !== "http://www.w3.org/2000/svg") {
                var h = c.getAttribute(t) || "";
                h = e + h;
                var g = l.get(h);
                g ? g.push(c) : l.set(h, [c])
            }
        }
        return l
    }

    function Rp(e, t, a) {
        e = e.ownerDocument || e, e.head.insertBefore(a, t === "title" ? e.querySelector("head > title") : null)
    }

    function R0(e, t, a) {
        if (a === 1 || t.itemProp != null) return !1;
        switch (e) {
            case"meta":
            case"title":
                return !0;
            case"style":
                if (typeof t.precedence != "string" || typeof t.href != "string" || t.href === "") break;
                return !0;
            case"link":
                if (typeof t.rel != "string" || typeof t.href != "string" || t.href === "" || t.onLoad || t.onError) break;
                return t.rel === "stylesheet" ? (e = t.disabled, typeof t.precedence == "string" && e == null) : !0;
            case"script":
                if (t.async && typeof t.async != "function" && typeof t.async != "symbol" && !t.onLoad && !t.onError && t.src && typeof t.src == "string") return !0
        }
        return !1
    }

    function wp(e) {
        return !(e.type === "stylesheet" && (e.state.loading & 3) === 0)
    }

    function w0(e, t, a, l) {
        if (a.type === "stylesheet" && (typeof l.media != "string" || matchMedia(l.media).matches !== !1) && (a.state.loading & 4) === 0) {
            if (a.instance === null) {
                var s = ll(l.href), c = t.querySelector(rr(s));
                if (c) {
                    t = c._p, t !== null && typeof t == "object" && typeof t.then == "function" && (e.count++, e = Lu.bind(e), t.then(e, e)), a.state.loading |= 4, a.instance = c, Ot(c);
                    return
                }
                c = t.ownerDocument || t, l = Tp(l), (s = xn.get(s)) && Cc(l, s), c = c.createElement("link"), Ot(c);
                var h = c;
                h._p = new Promise(function (g, E) {
                    h.onload = g, h.onerror = E
                }), Ct(c, "link", l), a.instance = c
            }
            e.stylesheets === null && (e.stylesheets = new Map), e.stylesheets.set(a, t), (t = a.state.preload) && (a.state.loading & 3) === 0 && (e.count++, a = Lu.bind(e), t.addEventListener("load", a), t.addEventListener("error", a))
        }
    }

    var Mc = 0;

    function N0(e, t) {
        return e.stylesheets && e.count === 0 && Bu(e, e.stylesheets), 0 < e.count || 0 < e.imgCount ? function (a) {
            var l = setTimeout(function () {
                if (e.stylesheets && Bu(e, e.stylesheets), e.unsuspend) {
                    var c = e.unsuspend;
                    e.unsuspend = null, c()
                }
            }, 6e4 + t);
            0 < e.imgBytes && Mc === 0 && (Mc = 62500 * f0());
            var s = setTimeout(function () {
                if (e.waitingForImages = !1, e.count === 0 && (e.stylesheets && Bu(e, e.stylesheets), e.unsuspend)) {
                    var c = e.unsuspend;
                    e.unsuspend = null, c()
                }
            }, (e.imgBytes > Mc ? 50 : 800) + t);
            return e.unsuspend = a, function () {
                e.unsuspend = null, clearTimeout(l), clearTimeout(s)
            }
        } : null
    }

    function Lu() {
        if (this.count--, this.count === 0 && (this.imgCount === 0 || !this.waitingForImages)) {
            if (this.stylesheets) Bu(this, this.stylesheets); else if (this.unsuspend) {
                var e = this.unsuspend;
                this.unsuspend = null, e()
            }
        }
    }

    var qu = null;

    function Bu(e, t) {
        e.stylesheets = null, e.unsuspend !== null && (e.count++, qu = new Map, t.forEach(C0, e), qu = null, Lu.call(e))
    }

    function C0(e, t) {
        if (!(t.state.loading & 4)) {
            var a = qu.get(e);
            if (a) var l = a.get(null); else {
                a = new Map, qu.set(e, a);
                for (var s = e.querySelectorAll("link[data-precedence],style[data-precedence]"), c = 0; c < s.length; c++) {
                    var h = s[c];
                    (h.nodeName === "LINK" || h.getAttribute("media") !== "not all") && (a.set(h.dataset.precedence, h), l = h)
                }
                l && a.set(null, l)
            }
            s = t.instance, h = s.getAttribute("data-precedence"), c = a.get(h) || l, c === l && a.set(null, s), a.set(h, s), this.count++, l = Lu.bind(this), s.addEventListener("load", l), s.addEventListener("error", l), c ? c.parentNode.insertBefore(s, c.nextSibling) : (e = e.nodeType === 9 ? e.head : e, e.insertBefore(s, e.firstChild)), t.state.loading |= 4
        }
    }

    var sr = {$$typeof: W, Provider: null, Consumer: null, _currentValue: ue, _currentValue2: ue, _threadCount: 0};

    function D0(e, t, a, l, s, c, h, g, E) {
        this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = As(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = As(0), this.hiddenUpdates = As(null), this.identifierPrefix = l, this.onUncaughtError = s, this.onCaughtError = c, this.onRecoverableError = h, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = E, this.incompleteTransitions = new Map
    }

    function Np(e, t, a, l, s, c, h, g, E, C, B, Q) {
        return e = new D0(e, t, a, h, E, C, B, Q, g), t = 1, c === !0 && (t |= 24), c = tn(3, null, null, t), e.current = c, c.stateNode = e, t = ho(), t.refCount++, e.pooledCache = t, t.refCount++, c.memoizedState = {
            element: l,
            isDehydrated: a,
            cache: t
        }, vo(c), e
    }

    function Cp(e) {
        return e ? (e = Li, e) : Li
    }

    function Dp(e, t, a, l, s, c) {
        s = Cp(s), l.context === null ? l.context = s : l.pendingContext = s, l = Oa(t), l.payload = {element: a}, c = c === void 0 ? null : c, c !== null && (l.callback = c), a = Ta(e, l, t), a !== null && (Pt(a, e, t), kl(a, e, t))
    }

    function Mp(e, t) {
        if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
            var a = e.retryLane;
            e.retryLane = a !== 0 && a < t ? a : t
        }
    }

    function Uc(e, t) {
        Mp(e, t), (e = e.alternate) && Mp(e, t)
    }

    function Up(e) {
        if (e.tag === 13 || e.tag === 31) {
            var t = Wa(e, 67108864);
            t !== null && Pt(t, e, 67108864), Uc(e, 67108864)
        }
    }

    function Zp(e) {
        if (e.tag === 13 || e.tag === 31) {
            var t = un();
            t = Rs(t);
            var a = Wa(e, t);
            a !== null && Pt(a, e, t), Uc(e, t)
        }
    }

    var ku = !0;

    function M0(e, t, a, l) {
        var s = Z.T;
        Z.T = null;
        var c = K.p;
        try {
            K.p = 2, Zc(e, t, a, l)
        } finally {
            K.p = c, Z.T = s
        }
    }

    function U0(e, t, a, l) {
        var s = Z.T;
        Z.T = null;
        var c = K.p;
        try {
            K.p = 8, Zc(e, t, a, l)
        } finally {
            K.p = c, Z.T = s
        }
    }

    function Zc(e, t, a, l) {
        if (ku) {
            var s = Lc(l);
            if (s === null) Ec(e, t, l, Hu, a), qp(e, l); else if (L0(s, e, t, a, l)) l.stopPropagation(); else if (qp(e, l), t & 4 && -1 < Z0.indexOf(e)) {
                for (; s !== null;) {
                    var c = Ti(s);
                    if (c !== null) switch (c.tag) {
                        case 3:
                            if (c = c.stateNode, c.current.memoizedState.isDehydrated) {
                                var h = Bn(c.pendingLanes);
                                if (h !== 0) {
                                    var g = c;
                                    for (g.pendingLanes |= 2, g.entangledLanes |= 2; h;) {
                                        var E = 1 << 31 - Ze(h);
                                        g.entanglements[1] |= E, h &= ~E
                                    }
                                    $n(c), (Ve & 6) === 0 && (xu = $t() + 500, nr(0))
                                }
                            }
                            break;
                        case 31:
                        case 13:
                            g = Wa(c, 2), g !== null && Pt(g, c, 2), Ou(), Uc(c, 2)
                    }
                    if (c = Lc(l), c === null && Ec(e, t, l, Hu, a), c === s) break;
                    s = c
                }
                s !== null && l.stopPropagation()
            } else Ec(e, t, l, null, a)
        }
    }

    function Lc(e) {
        return e = qs(e), qc(e)
    }

    var Hu = null;

    function qc(e) {
        if (Hu = null, e = Oi(e), e !== null) {
            var t = f(e);
            if (t === null) e = null; else {
                var a = t.tag;
                if (a === 13) {
                    if (e = d(t), e !== null) return e;
                    e = null
                } else if (a === 31) {
                    if (e = m(t), e !== null) return e;
                    e = null
                } else if (a === 3) {
                    if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
                    e = null
                } else t !== e && (e = null)
            }
        }
        return Hu = e, null
    }

    function Lp(e) {
        switch (e) {
            case"beforetoggle":
            case"cancel":
            case"click":
            case"close":
            case"contextmenu":
            case"copy":
            case"cut":
            case"auxclick":
            case"dblclick":
            case"dragend":
            case"dragstart":
            case"drop":
            case"focusin":
            case"focusout":
            case"input":
            case"invalid":
            case"keydown":
            case"keypress":
            case"keyup":
            case"mousedown":
            case"mouseup":
            case"paste":
            case"pause":
            case"play":
            case"pointercancel":
            case"pointerdown":
            case"pointerup":
            case"ratechange":
            case"reset":
            case"resize":
            case"seeked":
            case"submit":
            case"toggle":
            case"touchcancel":
            case"touchend":
            case"touchstart":
            case"volumechange":
            case"change":
            case"selectionchange":
            case"textInput":
            case"compositionstart":
            case"compositionend":
            case"compositionupdate":
            case"beforeblur":
            case"afterblur":
            case"beforeinput":
            case"blur":
            case"fullscreenchange":
            case"focus":
            case"hashchange":
            case"popstate":
            case"select":
            case"selectstart":
                return 2;
            case"drag":
            case"dragenter":
            case"dragexit":
            case"dragleave":
            case"dragover":
            case"mousemove":
            case"mouseout":
            case"mouseover":
            case"pointermove":
            case"pointerout":
            case"pointerover":
            case"scroll":
            case"touchmove":
            case"wheel":
            case"mouseenter":
            case"mouseleave":
            case"pointerenter":
            case"pointerleave":
                return 8;
            case"message":
                switch (Ff()) {
                    case Sl:
                        return 2;
                    case _:
                        return 8;
                    case j:
                    case w:
                        return 32;
                    case X:
                        return 268435456;
                    default:
                        return 32
                }
            default:
                return 32
        }
    }

    var Bc = !1, La = null, qa = null, Ba = null, or = new Map, cr = new Map, ka = [],
        Z0 = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");

    function qp(e, t) {
        switch (e) {
            case"focusin":
            case"focusout":
                La = null;
                break;
            case"dragenter":
            case"dragleave":
                qa = null;
                break;
            case"mouseover":
            case"mouseout":
                Ba = null;
                break;
            case"pointerover":
            case"pointerout":
                or.delete(t.pointerId);
                break;
            case"gotpointercapture":
            case"lostpointercapture":
                cr.delete(t.pointerId)
        }
    }

    function fr(e, t, a, l, s, c) {
        return e === null || e.nativeEvent !== c ? (e = {
            blockedOn: t,
            domEventName: a,
            eventSystemFlags: l,
            nativeEvent: c,
            targetContainers: [s]
        }, t !== null && (t = Ti(t), t !== null && Up(t)), e) : (e.eventSystemFlags |= l, t = e.targetContainers, s !== null && t.indexOf(s) === -1 && t.push(s), e)
    }

    function L0(e, t, a, l, s) {
        switch (t) {
            case"focusin":
                return La = fr(La, e, t, a, l, s), !0;
            case"dragenter":
                return qa = fr(qa, e, t, a, l, s), !0;
            case"mouseover":
                return Ba = fr(Ba, e, t, a, l, s), !0;
            case"pointerover":
                var c = s.pointerId;
                return or.set(c, fr(or.get(c) || null, e, t, a, l, s)), !0;
            case"gotpointercapture":
                return c = s.pointerId, cr.set(c, fr(cr.get(c) || null, e, t, a, l, s)), !0
        }
        return !1
    }

    function Bp(e) {
        var t = Oi(e.target);
        if (t !== null) {
            var a = f(t);
            if (a !== null) {
                if (t = a.tag, t === 13) {
                    if (t = d(a), t !== null) {
                        e.blockedOn = t, Wf(e.priority, function () {
                            Zp(a)
                        });
                        return
                    }
                } else if (t === 31) {
                    if (t = m(a), t !== null) {
                        e.blockedOn = t, Wf(e.priority, function () {
                            Zp(a)
                        });
                        return
                    }
                } else if (t === 3 && a.stateNode.current.memoizedState.isDehydrated) {
                    e.blockedOn = a.tag === 3 ? a.stateNode.containerInfo : null;
                    return
                }
            }
        }
        e.blockedOn = null
    }

    function Vu(e) {
        if (e.blockedOn !== null) return !1;
        for (var t = e.targetContainers; 0 < t.length;) {
            var a = Lc(e.nativeEvent);
            if (a === null) {
                a = e.nativeEvent;
                var l = new a.constructor(a.type, a);
                Ls = l, a.target.dispatchEvent(l), Ls = null
            } else return t = Ti(a), t !== null && Up(t), e.blockedOn = a, !1;
            t.shift()
        }
        return !0
    }

    function kp(e, t, a) {
        Vu(e) && a.delete(t)
    }

    function q0() {
        Bc = !1, La !== null && Vu(La) && (La = null), qa !== null && Vu(qa) && (qa = null), Ba !== null && Vu(Ba) && (Ba = null), or.forEach(kp), cr.forEach(kp)
    }

    function $u(e, t) {
        e.blockedOn === t && (e.blockedOn = null, Bc || (Bc = !0, n.unstable_scheduleCallback(n.unstable_NormalPriority, q0)))
    }

    var Qu = null;

    function Hp(e) {
        Qu !== e && (Qu = e, n.unstable_scheduleCallback(n.unstable_NormalPriority, function () {
            Qu === e && (Qu = null);
            for (var t = 0; t < e.length; t += 3) {
                var a = e[t], l = e[t + 1], s = e[t + 2];
                if (typeof l != "function") {
                    if (qc(l || a) === null) continue;
                    break
                }
                var c = Ti(a);
                c !== null && (e.splice(t, 3), t -= 3, Lo(c, {pending: !0, data: s, method: a.method, action: l}, l, s))
            }
        }))
    }

    function ul(e) {
        function t(E) {
            return $u(E, e)
        }

        La !== null && $u(La, e), qa !== null && $u(qa, e), Ba !== null && $u(Ba, e), or.forEach(t), cr.forEach(t);
        for (var a = 0; a < ka.length; a++) {
            var l = ka[a];
            l.blockedOn === e && (l.blockedOn = null)
        }
        for (; 0 < ka.length && (a = ka[0], a.blockedOn === null);) Bp(a), a.blockedOn === null && ka.shift();
        if (a = (e.ownerDocument || e).$$reactFormReplay, a != null) for (l = 0; l < a.length; l += 3) {
            var s = a[l], c = a[l + 1], h = s[Yt] || null;
            if (typeof c == "function") h || Hp(a); else if (h) {
                var g = null;
                if (c && c.hasAttribute("formAction")) {
                    if (s = c, h = c[Yt] || null) g = h.formAction; else if (qc(s) !== null) continue
                } else g = h.action;
                typeof g == "function" ? a[l + 1] = g : (a.splice(l, 3), l -= 3), Hp(a)
            }
        }
    }

    function Vp() {
        function e(c) {
            c.canIntercept && c.info === "react-transition" && c.intercept({
                handler: function () {
                    return new Promise(function (h) {
                        return s = h
                    })
                }, focusReset: "manual", scroll: "manual"
            })
        }

        function t() {
            s !== null && (s(), s = null), l || setTimeout(a, 20)
        }

        function a() {
            if (!l && !navigation.transition) {
                var c = navigation.currentEntry;
                c && c.url != null && navigation.navigate(c.url, {
                    state: c.getState(),
                    info: "react-transition",
                    history: "replace"
                })
            }
        }

        if (typeof navigation == "object") {
            var l = !1, s = null;
            return navigation.addEventListener("navigate", e), navigation.addEventListener("navigatesuccess", t), navigation.addEventListener("navigateerror", t), setTimeout(a, 100), function () {
                l = !0, navigation.removeEventListener("navigate", e), navigation.removeEventListener("navigatesuccess", t), navigation.removeEventListener("navigateerror", t), s !== null && (s(), s = null)
            }
        }
    }

    function kc(e) {
        this._internalRoot = e
    }

    Yu.prototype.render = kc.prototype.render = function (e) {
        var t = this._internalRoot;
        if (t === null) throw Error(u(409));
        var a = t.current, l = un();
        Dp(a, l, e, t, null, null)
    }, Yu.prototype.unmount = kc.prototype.unmount = function () {
        var e = this._internalRoot;
        if (e !== null) {
            this._internalRoot = null;
            var t = e.containerInfo;
            Dp(e.current, 2, null, e, null, null), Ou(), t[zi] = null
        }
    };

    function Yu(e) {
        this._internalRoot = e
    }

    Yu.prototype.unstable_scheduleHydration = function (e) {
        if (e) {
            var t = If();
            e = {blockedOn: null, target: e, priority: t};
            for (var a = 0; a < ka.length && t !== 0 && t < ka[a].priority; a++) ;
            ka.splice(a, 0, e), a === 0 && Bp(e)
        }
    };
    var $p = i.version;
    if ($p !== "19.2.7") throw Error(u(527, $p, "19.2.7"));
    K.findDOMNode = function (e) {
        var t = e._reactInternals;
        if (t === void 0) throw typeof e.render == "function" ? Error(u(188)) : (e = Object.keys(e).join(","), Error(u(268, e)));
        return e = v(t), e = e !== null ? b(e) : null, e = e === null ? null : e.stateNode, e
    };
    var B0 = {
        bundleType: 0,
        version: "19.2.7",
        rendererPackageName: "react-dom",
        currentDispatcherRef: Z,
        reconcilerVersion: "19.2.7"
    };
    if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
        var Gu = __REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (!Gu.isDisabled && Gu.supportsFiber) try {
            P = Gu.inject(B0), ae = Gu
        } catch {
        }
    }
    return hr.createRoot = function (e, t) {
        if (!o(e)) throw Error(u(299));
        var a = !1, l = "", s = Kh, c = Ph, h = Ih;
        return t != null && (t.unstable_strictMode === !0 && (a = !0), t.identifierPrefix !== void 0 && (l = t.identifierPrefix), t.onUncaughtError !== void 0 && (s = t.onUncaughtError), t.onCaughtError !== void 0 && (c = t.onCaughtError), t.onRecoverableError !== void 0 && (h = t.onRecoverableError)), t = Np(e, 1, !1, null, null, a, l, null, s, c, h, Vp), e[zi] = t.current, Sc(e), new kc(t)
    }, hr.hydrateRoot = function (e, t, a) {
        if (!o(e)) throw Error(u(299));
        var l = !1, s = "", c = Kh, h = Ph, g = Ih, E = null;
        return a != null && (a.unstable_strictMode === !0 && (l = !0), a.identifierPrefix !== void 0 && (s = a.identifierPrefix), a.onUncaughtError !== void 0 && (c = a.onUncaughtError), a.onCaughtError !== void 0 && (h = a.onCaughtError), a.onRecoverableError !== void 0 && (g = a.onRecoverableError), a.formState !== void 0 && (E = a.formState)), t = Np(e, 1, !0, t, a ?? null, l, s, E, c, h, g, Vp), t.context = Cp(null), a = t.current, l = un(), l = Rs(l), s = Oa(l), s.callback = null, Ta(a, s, l), a = l, t.current.lanes = a, El(t, a), $n(t), e[zi] = t.current, Sc(e), new Yu(t)
    }, hr.version = "19.2.7", hr
}

var oy;

function M_() {
    if (oy) return $c.exports;
    oy = 1;

    function n() {
        if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function")) try {
            __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n)
        } catch (i) {
            console.error(i)
        }
    }

    return n(), $c.exports = D_(), $c.exports
}

var U_ = M_();
var Of = /^(?:[a-z][a-z0-9+.-]*:|[\\/]{2})/i, gv = /^[\\/]{2}/;

function Z_(n, i) {
    return i + n.replace(/\\/g, "/")
}

var cy = "popstate";

function fy(n) {
    return typeof n == "object" && n != null && "pathname" in n && "search" in n && "hash" in n && "state" in n && "key" in n
}

function L_(n = {}) {
    function i(u, o) {
        let f = o.state?.masked, {pathname: d, search: m, hash: y} = f || u.location;
        return sf("", {
            pathname: d,
            search: m,
            hash: y
        }, o.state && o.state.usr || null, o.state && o.state.key || "default", f ? {
            pathname: u.location.pathname,
            search: u.location.search,
            hash: u.location.hash
        } : void 0)
    }

    function r(u, o) {
        return typeof o == "string" ? o : xr(o)
    }

    return B_(i, r, null, n)
}

function at(n, i) {
    if (n === !1 || n === null || typeof n > "u") throw new Error(i)
}

function Zn(n, i) {
    if (!n) {
        typeof console < "u" && console.warn(i);
        try {
            throw new Error(i)
        } catch {
        }
    }
}

function q_() {
    return Math.random().toString(36).substring(2, 10)
}

function dy(n, i) {
    return {
        usr: n.state,
        key: n.key,
        idx: i,
        masked: n.mask ? {pathname: n.pathname, search: n.search, hash: n.hash} : void 0
    }
}

function sf(n, i, r = null, u, o) {
    return {
        pathname: typeof n == "string" ? n : n.pathname,
        search: "",
        hash: "", ...typeof i == "string" ? pl(i) : i,
        state: r,
        key: i && i.key || u || q_(),
        mask: o
    }
}

function xr({pathname: n = "/", search: i = "", hash: r = ""}) {
    return i && i !== "?" && (n += i.charAt(0) === "?" ? i : "?" + i), r && r !== "#" && (n += r.charAt(0) === "#" ? r : "#" + r), n
}

function pl(n) {
    let i = {};
    if (n) {
        let r = n.indexOf("#");
        r >= 0 && (i.hash = n.substring(r), n = n.substring(0, r));
        let u = n.indexOf("?");
        u >= 0 && (i.search = n.substring(u), n = n.substring(0, u)), n && (i.pathname = n)
    }
    return i
}

function B_(n, i, r, u = {}) {
    let {window: o = document.defaultView, v5Compat: f = !1} = u, d = o.history, m = "POP", y = null, v = b();
    v == null && (v = 0, d.replaceState({...d.state, idx: v}, ""));

    function b() {
        return (d.state || {idx: null}).idx
    }

    function S() {
        m = "POP";
        let U = b(), J = U == null ? null : U - v;
        v = U, y && y({action: m, location: V.location, delta: J})
    }

    function T(U, J) {
        m = "PUSH";
        let G = fy(U) ? U : sf(V.location, U, J);
        v = b() + 1;
        let W = dy(G, v), Y = V.createHref(G.mask || G);
        try {
            d.pushState(W, "", Y)
        } catch (te) {
            if (te instanceof DOMException && te.name === "DataCloneError") throw te;
            o.location.assign(Y)
        }
        f && y && y({action: m, location: V.location, delta: 1})
    }

    function R(U, J) {
        m = "REPLACE";
        let G = fy(U) ? U : sf(V.location, U, J);
        v = b();
        let W = dy(G, v), Y = V.createHref(G.mask || G);
        d.replaceState(W, "", Y), f && y && y({action: m, location: V.location, delta: 0})
    }

    function q(U) {
        return k_(o, U)
    }

    let V = {
        get action() {
            return m
        }, get location() {
            return n(o, d)
        }, listen(U) {
            if (y) throw new Error("A history only accepts one active listener");
            return o.addEventListener(cy, S), y = U, () => {
                o.removeEventListener(cy, S), y = null
            }
        }, createHref(U) {
            return i(o, U)
        }, createURL: q, encodeLocation(U) {
            let J = q(U);
            return {pathname: J.pathname, search: J.search, hash: J.hash}
        }, push: T, replace: R, go(U) {
            return d.go(U)
        }
    };
    return V
}

function k_(n, i, r = !1) {
    let u = "http://localhost";
    n && (u = n.location.origin !== "null" ? n.location.origin : n.location.href), at(u, "No window.location.(origin|href) available to create URL");
    let o = typeof i == "string" ? i : xr(i);
    return o = o.replace(/ $/, "%20"), !r && gv.test(o) && (o = u + o), new URL(o, u)
}

function bv(n, i, r = "/") {
    return H_(n, i, r, !1)
}

function H_(n, i, r, u, o) {
    let f = typeof i == "string" ? pl(i) : i, d = pa(f.pathname || "/", r);
    if (d == null) return null;
    let m = V_(n), y = null, v = W_(d);
    for (let b = 0; y == null && b < m.length; ++b) y = I_(m[b], v, u);
    return y
}

function V_(n) {
    let i = _v(n);
    return $_(i), i
}

function _v(n, i = [], r = [], u = "", o = !1) {
    let f = (d, m, y = o, v) => {
        let b = {
            relativePath: v === void 0 ? d.path || "" : v,
            caseSensitive: d.caseSensitive === !0,
            childrenIndex: m,
            route: d
        };
        if (b.relativePath.startsWith("/")) {
            if (!b.relativePath.startsWith(u) && y) return;
            at(b.relativePath.startsWith(u), `Absolute route path "${b.relativePath}" nested under path "${u}" is not valid. An absolute child route path must start with the combined path of all its parent routes.`), b.relativePath = b.relativePath.slice(u.length)
        }
        let S = Un([u, b.relativePath]), T = r.concat(b);
        d.children && d.children.length > 0 && (at(d.index !== !0, `Index routes must not have child routes. Please remove all child routes from route path "${S}".`), _v(d.children, i, T, S, y)), !(d.path == null && !d.index) && i.push({
            path: S,
            score: K_(S, d.index),
            routesMeta: T.map((R, q) => {
                let [V, U] = xv(R.relativePath, R.caseSensitive, q === T.length - 1);
                return {...R, matcher: V, compiledParams: U}
            })
        })
    };
    return n.forEach((d, m) => {
        if (d.path === "" || !d.path?.includes("?")) f(d, m); else for (let y of Sv(d.path)) f(d, m, !0, y)
    }), i
}

function Sv(n) {
    let i = n.split("/");
    if (i.length === 0) return [];
    let [r, ...u] = i, o = r.endsWith("?"), f = r.replace(/\?$/, "");
    if (u.length === 0) return o ? [f, ""] : [f];
    let d = Sv(u.join("/")), m = [];
    return m.push(...d.map(y => y === "" ? f : [f, y].join("/"))), o && m.push(...d), m.map(y => n.startsWith("/") && y === "" ? "/" : y)
}

function $_(n) {
    n.sort((i, r) => i.score !== r.score ? r.score - i.score : P_(i.routesMeta.map(u => u.childrenIndex), r.routesMeta.map(u => u.childrenIndex)))
}

var Q_ = /^:[\w-]+$/, Y_ = 3, G_ = 2, F_ = 1, X_ = 10, J_ = -2, hy = n => n === "*";

function K_(n, i) {
    let r = n.split("/"), u = r.length;
    return r.some(hy) && (u += J_), i && (u += G_), r.filter(o => !hy(o)).reduce((o, f) => o + (Q_.test(f) ? Y_ : f === "" ? F_ : X_), u)
}

function P_(n, i) {
    return n.length === i.length && n.slice(0, -1).every((u, o) => u === i[o]) ? n[n.length - 1] - i[i.length - 1] : 0
}

function I_(n, i, r = !1) {
    let {routesMeta: u} = n, o = {}, f = "/", d = [];
    for (let m = 0; m < u.length; ++m) {
        let y = u[m], v = m === u.length - 1, b = f === "/" ? i : i.slice(f.length) || "/",
            S = {path: y.relativePath, caseSensitive: y.caseSensitive, end: v},
            T = y.matcher && y.compiledParams ? Ev(S, b, y.matcher, y.compiledParams) : is(S, b), R = y.route;
        if (!T && v && r && !u[u.length - 1].route.index && (T = is({
            path: y.relativePath,
            caseSensitive: y.caseSensitive,
            end: !1
        }, b)), !T) return null;
        Object.assign(o, T.params), d.push({
            params: o,
            pathname: Un([f, T.pathname]),
            pathnameBase: nS(Un([f, T.pathnameBase])),
            route: R
        }), T.pathnameBase !== "/" && (f = Un([f, T.pathnameBase]))
    }
    return d
}

function is(n, i) {
    typeof n == "string" && (n = {path: n, caseSensitive: !1, end: !0});
    let [r, u] = xv(n.path, n.caseSensitive, n.end);
    return Ev(n, i, r, u)
}

function Ev(n, i, r, u) {
    let o = i.match(r);
    if (!o) return null;
    let f = o[0], d = f.replace(/(.)\/+$/, "$1"), m = o.slice(1);
    return {
        params: u.reduce((v, {paramName: b, isOptional: S}, T) => {
            if (b === "*") {
                let q = m[T] || "";
                d = f.slice(0, f.length - q.length).replace(/(.)\/+$/, "$1")
            }
            const R = m[T];
            return S && !R ? v[b] = void 0 : v[b] = (R || "").replace(/%2F/g, "/"), v
        }, {}), pathname: f, pathnameBase: d, pattern: n
    }
}

function xv(n, i = !1, r = !0) {
    Zn(n === "*" || !n.endsWith("*") || n.endsWith("/*"), `Route path "${n}" will be treated as if it were "${n.replace(/\*$/, "/*")}" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to "${n.replace(/\*$/, "/*")}".`);
    let u = [],
        o = "^" + n.replace(/\/*\*?$/, "").replace(/^\/*/, "/").replace(/[\\.*+^${}|()[\]]/g, "\\$&").replace(/\/:([\w-]+)(\?)?/g, (d, m, y, v, b) => {
            if (u.push({paramName: m, isOptional: y != null}), y) {
                let S = b.charAt(v + d.length);
                return S && S !== "/" ? "/([^\\/]*)" : "(?:/([^\\/]*))?"
            }
            return "/([^\\/]+)"
        }).replace(/\/([\w-]+)\?(\/|$)/g, "(/$1)?$2");
    return n.endsWith("*") ? (u.push({paramName: "*"}), o += n === "*" || n === "/*" ? "(.*)$" : "(?:\\/(.+)|\\/*)$") : r ? o += "\\/*$" : n !== "" && n !== "/" && (o += "(?:(?=\\/|$))"), [new RegExp(o, i ? void 0 : "i"), u]
}

function W_(n) {
    try {
        return n.split("/").map(i => decodeURIComponent(i).replace(/\//g, "%2F")).join("/")
    } catch (i) {
        return Zn(!1, `The URL path "${n}" could not be decoded because it is a malformed URL segment. This is probably due to a bad percent encoding (${i}).`), n
    }
}

function pa(n, i) {
    if (i === "/") return n;
    if (!n.toLowerCase().startsWith(i.toLowerCase())) return null;
    let r = i.endsWith("/") ? i.length - 1 : i.length, u = n.charAt(r);
    return u && u !== "/" ? null : n.slice(r) || "/"
}

function eS(n, i = "/") {
    let {pathname: r, search: u = "", hash: o = ""} = typeof n == "string" ? pl(n) : n, f;
    return r ? (r = zv(r), r.startsWith("/") ? f = my(r.substring(1), "/") : f = my(r, i)) : f = i, {
        pathname: f,
        search: aS(u),
        hash: iS(o)
    }
}

function my(n, i) {
    let r = ls(i).split("/");
    return n.split("/").forEach(o => {
        o === ".." ? r.length > 1 && r.pop() : o !== "." && r.push(o)
    }), r.length > 1 ? r.join("/") : "/"
}

function Fc(n, i, r, u) {
    return `Cannot include a '${n}' character in a manually specified \`to.${i}\` field [${JSON.stringify(u)}].  Please separate it out to the \`to.${r}\` field. Alternatively you may provide the full path as a string in <Link to="..."> and the router will parse it for you.`
}

function tS(n) {
    return n.filter((i, r) => r === 0 || i.route.path && i.route.path.length > 0)
}

function Tf(n) {
    let i = tS(n);
    return i.map((r, u) => u === i.length - 1 ? r.pathname : r.pathnameBase)
}

function ds(n, i, r, u = !1) {
    let o;
    typeof n == "string" ? o = pl(n) : (o = {...n}, at(!o.pathname || !o.pathname.includes("?"), Fc("?", "pathname", "search", o)), at(!o.pathname || !o.pathname.includes("#"), Fc("#", "pathname", "hash", o)), at(!o.search || !o.search.includes("#"), Fc("#", "search", "hash", o)));
    let f = n === "" || o.pathname === "", d = f ? "/" : o.pathname, m;
    if (d == null) m = r; else {
        let S = i.length - 1;
        if (!u && d.startsWith("..")) {
            let T = d.split("/");
            for (; T[0] === "..";) T.shift(), S -= 1;
            o.pathname = T.join("/")
        }
        m = S >= 0 ? i[S] : "/"
    }
    let y = eS(o, m), v = d && d !== "/" && d.endsWith("/"), b = (f || d === ".") && r.endsWith("/");
    return !y.pathname.endsWith("/") && (v || b) && (y.pathname += "/"), y
}

var zv = n => n.replace(/[\\/]{2,}/g, "/"), Un = n => zv(n.join("/")), ls = n => n.replace(/\/+$/, ""),
    nS = n => ls(n).replace(/^\/*/, "/"), aS = n => !n || n === "?" ? "" : n.startsWith("?") ? n : "?" + n,
    iS = n => !n || n === "#" ? "" : n.startsWith("#") ? n : "#" + n, lS = class {
        constructor(n, i, r, u = !1) {
            this.status = n, this.statusText = i || "", this.internal = u, r instanceof Error ? (this.data = r.toString(), this.error = r) : this.data = r
        }
    };

function rS(n) {
    return n != null && typeof n.status == "number" && typeof n.statusText == "string" && typeof n.internal == "boolean" && "data" in n
}

function uS(n) {
    let i = n.map(r => r.route.path).filter(Boolean);
    return Un(i) || "/"
}

var Ov = typeof window < "u" && typeof window.document < "u" && typeof window.document.createElement < "u";

function Tv(n, i) {
    let r = n;
    if (typeof r != "string" || !Of.test(r)) return {absoluteURL: void 0, isExternal: !1, to: r};
    let u = r, o = !1;
    if (Ov) try {
        let f = new URL(window.location.href), d = gv.test(r) ? new URL(Z_(r, f.protocol)) : new URL(r),
            m = pa(d.pathname, i);
        d.origin === f.origin && m != null ? r = m + d.search + d.hash : o = !0
    } catch {
        Zn(!1, `<Link to="${r}"> contains an invalid URL which will probably break when clicked - please update to a valid URL path.`)
    }
    return {absoluteURL: u, isExternal: o, to: r}
}

Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
var jv = ["POST", "PUT", "PATCH", "DELETE"];
new Set(jv);
var sS = ["GET", ...jv];
new Set(sS);
var oS = ["about:", "blob:", "chrome:", "chrome-untrusted:", "content:", "data:", "devtools:", "file:", "filesystem:", "javascript:"];

function cS(n) {
    try {
        return oS.includes(new URL(n).protocol)
    } catch {
        return !1
    }
}

var yl = D.createContext(null);
yl.displayName = "DataRouter";
var hs = D.createContext(null);
hs.displayName = "DataRouterState";
var Av = D.createContext(!1);

function fS() {
    return D.useContext(Av)
}

var Rv = D.createContext({isTransitioning: !1});
Rv.displayName = "ViewTransition";
var dS = D.createContext(new Map);
dS.displayName = "Fetchers";
var hS = D.createContext(null);
hS.displayName = "Await";
var fn = D.createContext(null);
fn.displayName = "Navigation";
var Tr = D.createContext(null);
Tr.displayName = "Location";
var jn = D.createContext({outlet: null, matches: [], isDataRoute: !1});
jn.displayName = "Route";
var jf = D.createContext(null);
jf.displayName = "RouteError";
var wv = "REACT_ROUTER_ERROR", mS = "REDIRECT", pS = "ROUTE_ERROR_RESPONSE";

function yS(n) {
    if (n.startsWith(`${wv}:${mS}:{`)) try {
        let i = JSON.parse(n.slice(28));
        if (typeof i == "object" && i && typeof i.status == "number" && typeof i.statusText == "string" && typeof i.location == "string" && typeof i.reloadDocument == "boolean" && typeof i.replace == "boolean") return i
    } catch {
    }
}

function vS(n) {
    if (n.startsWith(`${wv}:${pS}:{`)) try {
        let i = JSON.parse(n.slice(40));
        if (typeof i == "object" && i && typeof i.status == "number" && typeof i.statusText == "string") return new lS(i.status, i.statusText, i.data)
    } catch {
    }
}

function gS(n, {relative: i} = {}) {
    at(vl(), "useHref() may be used only in the context of a <Router> component.");
    let {basename: r, navigator: u} = D.useContext(fn), {hash: o, pathname: f, search: d} = Ar(n, {relative: i}), m = f;
    return r !== "/" && (m = f === "/" ? r : Un([r, f])), u.createHref({pathname: m, search: d, hash: o})
}

function vl() {
    return D.useContext(Tr) != null
}

function Fn() {
    return at(vl(), "useLocation() may be used only in the context of a <Router> component."), D.useContext(Tr).location
}

var Nv = "You should call navigate() in a React.useEffect(), not when your component is first rendered.";

function Cv(n) {
    D.useContext(fn).static || D.useLayoutEffect(n)
}

function jr() {
    let {isDataRoute: n} = D.useContext(jn);
    return n ? DS() : bS()
}

function bS() {
    at(vl(), "useNavigate() may be used only in the context of a <Router> component.");
    let n = D.useContext(yl), {
            basename: i,
            navigator: r
        } = D.useContext(fn), {matches: u} = D.useContext(jn), {pathname: o} = Fn(), f = JSON.stringify(Tf(u)),
        d = D.useRef(!1);
    return Cv(() => {
        d.current = !0
    }), D.useCallback((y, v = {}) => {
        if (Zn(d.current, Nv), !d.current) return;
        if (typeof y == "number") {
            r.go(y);
            return
        }
        let b = ds(y, JSON.parse(f), o, v.relative === "path");
        n == null && i !== "/" && (b.pathname = b.pathname === "/" ? i : Un([i, b.pathname])), (v.replace ? r.replace : r.push)(b, v.state, v)
    }, [i, r, f, o, n])
}

var _S = D.createContext(null);

function SS(n) {
    let i = D.useContext(jn).outlet;
    return D.useMemo(() => i && D.createElement(_S.Provider, {value: n}, i), [i, n])
}

function Dv() {
    let {matches: n} = D.useContext(jn);
    return n[n.length - 1]?.params ?? {}
}

function Ar(n, {relative: i} = {}) {
    let {matches: r} = D.useContext(jn), {pathname: u} = Fn(), o = JSON.stringify(Tf(r));
    return D.useMemo(() => ds(n, JSON.parse(o), u, i === "path"), [n, o, u, i])
}

function ES(n, i) {
    return Mv(n, i)
}

function Mv(n, i, r) {
    at(vl(), "useRoutes() may be used only in the context of a <Router> component.");
    let {navigator: u} = D.useContext(fn), {matches: o} = D.useContext(jn), f = o[o.length - 1], d = f ? f.params : {},
        m = f ? f.pathname : "/", y = f ? f.pathnameBase : "/", v = f && f.route;
    {
        let U = v && v.path || "";
        Zv(m, !v || U.endsWith("*") || U.endsWith("*?"), `You rendered descendant <Routes> (or called \`useRoutes()\`) at "${m}" (under <Route path="${U}">) but the parent route path has no trailing "*". This means if you navigate deeper, the parent won't match anymore and therefore the child routes will never render.

Please change the parent <Route path="${U}"> to <Route path="${U === "/" ? "*" : `${U}/*`}">.`)
    }
    let b = Fn(), S;
    if (i) {
        let U = typeof i == "string" ? pl(i) : i;
        at(y === "/" || U.pathname?.startsWith(y), `When overriding the location using \`<Routes location>\` or \`useRoutes(routes, location)\`, the location pathname must begin with the portion of the URL pathname that was matched by all parent routes. The current pathname base is "${y}" but pathname "${U.pathname}" was given in the \`location\` prop.`), S = U
    } else S = b;
    let T = S.pathname || "/", R = T;
    if (y !== "/") {
        let U = y.replace(/^\//, "").split("/");
        R = "/" + T.replace(/^\//, "").split("/").slice(U.length).join("/")
    }
    let q = r && r.state.matches.length ? r.state.matches.map(U => Object.assign(U, {route: r.manifest[U.route.id] || U.route})) : bv(n, {pathname: R});
    Zn(v || q != null, `No routes matched location "${S.pathname}${S.search}${S.hash}" `), Zn(q == null || q[q.length - 1].route.element !== void 0 || q[q.length - 1].route.Component !== void 0 || q[q.length - 1].route.lazy !== void 0, `Matched leaf route at location "${S.pathname}${S.search}${S.hash}" does not have an element or Component. This means it will render an <Outlet /> with a null value by default resulting in an "empty" page.`);
    let V = jS(q && q.map(U => Object.assign({}, U, {
        params: Object.assign({}, d, U.params),
        pathname: Un([y, u.encodeLocation ? u.encodeLocation(U.pathname.replace(/%/g, "%25").replace(/\?/g, "%3F").replace(/#/g, "%23")).pathname : U.pathname]),
        pathnameBase: U.pathnameBase === "/" ? y : Un([y, u.encodeLocation ? u.encodeLocation(U.pathnameBase.replace(/%/g, "%25").replace(/\?/g, "%3F").replace(/#/g, "%23")).pathname : U.pathnameBase])
    })), o, r);
    return i && V ? D.createElement(Tr.Provider, {
        value: {
            location: {
                pathname: "/",
                search: "",
                hash: "",
                state: null,
                key: "default",
                mask: void 0, ...S
            }, navigationType: "POP"
        }
    }, V) : V
}

function xS() {
    let n = CS(), i = rS(n) ? `${n.status} ${n.statusText}` : n instanceof Error ? n.message : JSON.stringify(n),
        r = n instanceof Error ? n.stack : null, u = "rgba(200,200,200, 0.5)",
        o = {padding: "0.5rem", backgroundColor: u}, f = {padding: "2px 4px", backgroundColor: u}, d = null;
    return console.error("Error handled by React Router default ErrorBoundary:", n), d = D.createElement(D.Fragment, null, D.createElement("p", null, "💿 Hey developer 👋"), D.createElement("p", null, "You can provide a way better UX than this when your app throws errors by providing your own ", D.createElement("code", {style: f}, "ErrorBoundary"), " or", " ", D.createElement("code", {style: f}, "errorElement"), " prop on your route.")), D.createElement(D.Fragment, null, D.createElement("h2", null, "Unexpected Application Error!"), D.createElement("h3", {style: {fontStyle: "italic"}}, i), r ? D.createElement("pre", {style: o}, r) : null, d)
}

var zS = D.createElement(xS, null), Uv = class extends D.Component {
    constructor(n) {
        super(n), this.state = {location: n.location, revalidation: n.revalidation, error: n.error}
    }

    static getDerivedStateFromError(n) {
        return {error: n}
    }

    static getDerivedStateFromProps(n, i) {
        return i.location !== n.location || i.revalidation !== "idle" && n.revalidation === "idle" ? {
            error: n.error,
            location: n.location,
            revalidation: n.revalidation
        } : {
            error: n.error !== void 0 ? n.error : i.error,
            location: i.location,
            revalidation: n.revalidation || i.revalidation
        }
    }

    componentDidCatch(n, i) {
        this.props.onError ? this.props.onError(n, i) : console.error("React Router caught the following error during render", n)
    }

    render() {
        let n = this.state.error;
        if (this.context && typeof n == "object" && n && "digest" in n && typeof n.digest == "string") {
            const r = vS(n.digest);
            r && (n = r)
        }
        let i = n !== void 0 ? D.createElement(jn.Provider, {value: this.props.routeContext}, D.createElement(jf.Provider, {
            value: n,
            children: this.props.component
        })) : this.props.children;
        return this.context ? D.createElement(OS, {error: n}, i) : i
    }
};
Uv.contextType = Av;
var Xc = new WeakMap;

function OS({children: n, error: i}) {
    let {basename: r} = D.useContext(fn);
    if (typeof i == "object" && i && "digest" in i && typeof i.digest == "string") {
        let u = yS(i.digest);
        if (u) {
            let o = Xc.get(i);
            if (o) throw o;
            let f = Tv(u.location, r), d = f.absoluteURL || f.to;
            if (cS(d)) throw new Error("Invalid redirect location");
            if (Ov && !Xc.get(i)) if (f.isExternal || u.reloadDocument) window.location.href = d; else {
                const m = Promise.resolve().then(() => window.__reactRouterDataRouter.navigate(f.to, {replace: u.replace}));
                throw Xc.set(i, m), m
            }
            return D.createElement("meta", {httpEquiv: "refresh", content: `0;url=${d}`})
        }
    }
    return n
}

function TS({routeContext: n, match: i, children: r}) {
    let u = D.useContext(yl);
    return u && u.static && u.staticContext && (i.route.errorElement || i.route.ErrorBoundary) && (u.staticContext._deepestRenderedBoundaryId = i.route.id), D.createElement(jn.Provider, {value: n}, r)
}

function jS(n, i = [], r) {
    let u = r?.state;
    if (n == null) {
        if (!u) return null;
        if (u.errors) n = u.matches; else if (i.length === 0 && !u.initialized && u.matches.length > 0) n = u.matches; else return null
    }
    let o = n, f = u?.errors;
    if (f != null) {
        let b = o.findIndex(S => S.route.id && f?.[S.route.id] !== void 0);
        at(b >= 0, `Could not find a matching route for errors on route IDs: ${Object.keys(f).join(",")}`), o = o.slice(0, Math.min(o.length, b + 1))
    }
    let d = !1, m = -1;
    if (r && u) {
        d = u.renderFallback;
        for (let b = 0; b < o.length; b++) {
            let S = o[b];
            if ((S.route.HydrateFallback || S.route.hydrateFallbackElement) && (m = b), S.route.id) {
                let {loaderData: T, errors: R} = u,
                    q = S.route.loader && !T.hasOwnProperty(S.route.id) && (!R || R[S.route.id] === void 0);
                if (S.route.lazy || q) {
                    r.isStatic && (d = !0), m >= 0 ? o = o.slice(0, m + 1) : o = [o[0]];
                    break
                }
            }
        }
    }
    let y = r?.onError, v = u && y ? (b, S) => {
        y(b, {location: u.location, params: u.matches?.[0]?.params ?? {}, pattern: uS(u.matches), errorInfo: S})
    } : void 0;
    return o.reduceRight((b, S, T) => {
        let R, q = !1, V = null, U = null;
        u && (R = f && S.route.id ? f[S.route.id] : void 0, V = S.route.errorElement || zS, d && (m < 0 && T === 0 ? (Zv("route-fallback", !1, "No `HydrateFallback` element provided to render during initial hydration"), q = !0, U = null) : m === T && (q = !0, U = S.route.hydrateFallbackElement || null)));
        let J = i.concat(o.slice(0, T + 1)), G = () => {
            let W;
            return R ? W = V : q ? W = U : S.route.Component ? W = D.createElement(S.route.Component, null) : S.route.element ? W = S.route.element : W = b, D.createElement(TS, {
                match: S,
                routeContext: {outlet: b, matches: J, isDataRoute: u != null},
                children: W
            })
        };
        return u && (S.route.ErrorBoundary || S.route.errorElement || T === 0) ? D.createElement(Uv, {
            location: u.location,
            revalidation: u.revalidation,
            component: V,
            error: R,
            children: G(),
            routeContext: {outlet: null, matches: J, isDataRoute: !0},
            onError: v
        }) : G()
    }, null)
}

function Af(n) {
    return `${n} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`
}

function AS(n) {
    let i = D.useContext(yl);
    return at(i, Af(n)), i
}

function RS(n) {
    let i = D.useContext(hs);
    return at(i, Af(n)), i
}

function wS(n) {
    let i = D.useContext(jn);
    return at(i, Af(n)), i
}

function Rf(n) {
    let i = wS(n), r = i.matches[i.matches.length - 1];
    return at(r.route.id, `${n} can only be used on routes that contain a unique "id"`), r.route.id
}

function NS() {
    return Rf("useRouteId")
}

function CS() {
    let n = D.useContext(jf), i = RS("useRouteError"), r = Rf("useRouteError");
    return n !== void 0 ? n : i.errors?.[r]
}

function DS() {
    let {router: n} = AS("useNavigate"), i = Rf("useNavigate"), r = D.useRef(!1);
    return Cv(() => {
        r.current = !0
    }), D.useCallback(async (o, f = {}) => {
        Zn(r.current, Nv), r.current && (typeof o == "number" ? await n.navigate(o) : await n.navigate(o, {fromRouteId: i, ...f}))
    }, [n, i])
}

var py = {};

function Zv(n, i, r) {
    !i && !py[n] && (py[n] = !0, Zn(!1, r))
}

D.memo(MS);

function MS({routes: n, manifest: i, future: r, state: u, isStatic: o, onError: f}) {
    return Mv(n, void 0, {manifest: i, state: u, isStatic: o, onError: f})
}

function of({to: n, replace: i, state: r, relative: u}) {
    at(vl(), "<Navigate> may be used only in the context of a <Router> component.");
    let {static: o} = D.useContext(fn);
    Zn(!o, "<Navigate> must not be used on the initial render in a <StaticRouter>. This is a no-op, but you should modify your code so the <Navigate> is only ever rendered in response to some user interaction or state change.");
    let {matches: f} = D.useContext(jn), {pathname: d} = Fn(), m = jr(), y = ds(n, Tf(f), d, u === "path"),
        v = JSON.stringify(y);
    return D.useEffect(() => {
        m(JSON.parse(v), {replace: i, state: r, relative: u})
    }, [m, v, u, i, r]), null
}

function US(n) {
    return SS(n.context)
}

function _t(n) {
    at(!1, "A <Route> is only ever to be used as the child of <Routes> element, never rendered directly. Please wrap your <Route> in a <Routes>.")
}

function ZS({
                basename: n = "/",
                children: i = null,
                location: r,
                navigationType: u = "POP",
                navigator: o,
                static: f = !1,
                useTransitions: d
            }) {
    at(!vl(), "You cannot render a <Router> inside another <Router>. You should never have more than one in your app.");
    let m = n.replace(/^\/*/, "/"),
        y = D.useMemo(() => ({basename: m, navigator: o, static: f, useTransitions: d, future: {}}), [m, o, f, d]);
    typeof r == "string" && (r = pl(r));
    let {pathname: v = "/", search: b = "", hash: S = "", state: T = null, key: R = "default", mask: q} = r,
        V = D.useMemo(() => {
            let U = pa(v, m);
            return U == null ? null : {
                location: {pathname: U, search: b, hash: S, state: T, key: R, mask: q},
                navigationType: u
            }
        }, [m, v, b, S, T, R, u, q]);
    return Zn(V != null, `<Router basename="${m}"> is not able to match the URL "${v}${b}${S}" because it does not start with the basename, so the <Router> won't render anything.`), V == null ? null : D.createElement(fn.Provider, {value: y}, D.createElement(Tr.Provider, {
        children: i,
        value: V
    }))
}

function LS({children: n, location: i}) {
    return ES(cf(n), i)
}

function cf(n, i = []) {
    let r = [];
    return D.Children.forEach(n, (u, o) => {
        if (!D.isValidElement(u)) return;
        let f = [...i, o];
        if (u.type === D.Fragment) {
            r.push.apply(r, cf(u.props.children, f));
            return
        }
        at(u.type === _t, `[${typeof u.type == "string" ? u.type : u.type.name}] is not a <Route> component. All component children of <Routes> must be a <Route> or <React.Fragment>`), at(!u.props.index || !u.props.children, "An index route cannot have child routes.");
        let d = {
            id: u.props.id || f.join("-"),
            caseSensitive: u.props.caseSensitive,
            element: u.props.element,
            Component: u.props.Component,
            index: u.props.index,
            path: u.props.path,
            middleware: u.props.middleware,
            loader: u.props.loader,
            action: u.props.action,
            hydrateFallbackElement: u.props.hydrateFallbackElement,
            HydrateFallback: u.props.HydrateFallback,
            errorElement: u.props.errorElement,
            ErrorBoundary: u.props.ErrorBoundary,
            hasErrorBoundary: u.props.hasErrorBoundary === !0 || u.props.ErrorBoundary != null || u.props.errorElement != null,
            shouldRevalidate: u.props.shouldRevalidate,
            handle: u.props.handle,
            lazy: u.props.lazy
        };
        u.props.children && (d.children = cf(u.props.children, f)), r.push(d)
    }), r
}

var Wu = "get", es = "application/x-www-form-urlencoded";

function ms(n) {
    return typeof HTMLElement < "u" && n instanceof HTMLElement
}

function qS(n) {
    return ms(n) && n.tagName.toLowerCase() === "button"
}

function BS(n) {
    return ms(n) && n.tagName.toLowerCase() === "form"
}

function kS(n) {
    return ms(n) && n.tagName.toLowerCase() === "input"
}

function HS(n) {
    return !!(n.metaKey || n.altKey || n.ctrlKey || n.shiftKey)
}

function VS(n, i) {
    return n.button === 0 && (!i || i === "_self") && !HS(n)
}

var Xu = null;

function $S() {
    if (Xu === null) try {
        new FormData(document.createElement("form"), 0), Xu = !1
    } catch {
        Xu = !0
    }
    return Xu
}

var QS = new Set(["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"]);

function Jc(n) {
    return n != null && !QS.has(n) ? (Zn(!1, `"${n}" is not a valid \`encType\` for \`<Form>\`/\`<fetcher.Form>\` and will default to "${es}"`), null) : n
}

function YS(n, i) {
    let r, u, o, f, d;
    if (BS(n)) {
        let m = n.getAttribute("action");
        u = m ? pa(m, i) : null, r = n.getAttribute("method") || Wu, o = Jc(n.getAttribute("enctype")) || es, f = new FormData(n)
    } else if (qS(n) || kS(n) && (n.type === "submit" || n.type === "image")) {
        let m = n.form;
        if (m == null) throw new Error('Cannot submit a <button> or <input type="submit"> without a <form>');
        let y = n.getAttribute("formaction") || m.getAttribute("action");
        if (u = y ? pa(y, i) : null, r = n.getAttribute("formmethod") || m.getAttribute("method") || Wu, o = Jc(n.getAttribute("formenctype")) || Jc(m.getAttribute("enctype")) || es, f = new FormData(m, n), !$S()) {
            let {name: v, type: b, value: S} = n;
            if (b === "image") {
                let T = v ? `${v}.` : "";
                f.append(`${T}x`, "0"), f.append(`${T}y`, "0")
            } else v && f.append(v, S)
        }
    } else {
        if (ms(n)) throw new Error('Cannot submit element that is not <form>, <button>, or <input type="submit|image">');
        r = Wu, u = null, o = es, d = n
    }
    return f && o === "text/plain" && (d = f, f = void 0), {
        action: u,
        method: r.toLowerCase(),
        encType: o,
        formData: f,
        body: d
    }
}

Object.getOwnPropertyNames(Object.prototype).sort().join("\0");

function wf(n, i) {
    if (n === !1 || n === null || typeof n > "u") throw new Error(i)
}

function Lv(n, i, r, u) {
    let o = typeof n == "string" ? new URL(n, typeof window > "u" ? "server://singlefetch/" : window.location.origin) : n;
    return r ? o.pathname.endsWith("/") ? o.pathname = `${o.pathname}_.${u}` : o.pathname = `${o.pathname}.${u}` : o.pathname === "/" ? o.pathname = `_root.${u}` : i && pa(o.pathname, i) === "/" ? o.pathname = `${ls(i)}/_root.${u}` : o.pathname = `${ls(o.pathname)}.${u}`, o
}

async function GS(n, i) {
    if (n.id in i) return i[n.id];
    try {
        let r = await import(n.module);
        return i[n.id] = r, r
    } catch (r) {
        return console.error(`Error loading route module \`${n.module}\`, reloading page...`), console.error(r), window.__reactRouterContext && window.__reactRouterContext.isSpaMode, window.location.reload(), new Promise(() => {
        })
    }
}

function FS(n) {
    return n == null ? !1 : n.href == null ? n.rel === "preload" && typeof n.imageSrcSet == "string" && typeof n.imageSizes == "string" : typeof n.rel == "string" && typeof n.href == "string"
}

async function XS(n, i, r) {
    let u = await Promise.all(n.map(async o => {
        let f = i.routes[o.route.id];
        if (f) {
            let d = await GS(f, r);
            return d.links ? d.links() : []
        }
        return []
    }));
    return IS(u.flat(1).filter(FS).filter(o => o.rel === "stylesheet" || o.rel === "preload").map(o => o.rel === "stylesheet" ? {
        ...o,
        rel: "prefetch",
        as: "style"
    } : {...o, rel: "prefetch"}))
}

function yy(n, i, r, u, o, f) {
    let d = (y, v) => r[v] ? y.route.id !== r[v].route.id : !0,
        m = (y, v) => r[v].pathname !== y.pathname || r[v].route.path?.endsWith("*") && r[v].params["*"] !== y.params["*"];
    return f === "assets" ? i.filter((y, v) => d(y, v) || m(y, v)) : f === "data" ? i.filter((y, v) => {
        let b = u.routes[y.route.id];
        if (!b || !b.hasLoader) return !1;
        if (d(y, v) || m(y, v)) return !0;
        if (y.route.shouldRevalidate) {
            let S = y.route.shouldRevalidate({
                currentUrl: new URL(o.pathname + o.search + o.hash, window.origin),
                currentParams: r[0]?.params || {},
                nextUrl: new URL(n, window.origin),
                nextParams: y.params,
                defaultShouldRevalidate: !0
            });
            if (typeof S == "boolean") return S
        }
        return !0
    }) : []
}

function JS(n, i, {includeHydrateFallback: r} = {}) {
    return KS(n.map(u => {
        let o = i.routes[u.route.id];
        if (!o) return [];
        let f = [o.module];
        return o.clientActionModule && (f = f.concat(o.clientActionModule)), o.clientLoaderModule && (f = f.concat(o.clientLoaderModule)), r && o.hydrateFallbackModule && (f = f.concat(o.hydrateFallbackModule)), o.imports && (f = f.concat(o.imports)), f
    }).flat(1))
}

function KS(n) {
    return [...new Set(n)]
}

function PS(n) {
    let i = {}, r = Object.keys(n).sort();
    for (let u of r) i[u] = n[u];
    return i
}

function IS(n, i) {
    let r = new Set;
    return new Set(i), n.reduce((u, o) => {
        let f = JSON.stringify(PS(o));
        return r.has(f) || (r.add(f), u.push({key: f, link: o})), u
    }, [])
}

function Nf() {
    let n = D.useContext(yl);
    return wf(n, "You must render this element inside a <DataRouterContext.Provider> element"), n
}

function WS() {
    let n = D.useContext(hs);
    return wf(n, "You must render this element inside a <DataRouterStateContext.Provider> element"), n
}

var Cf = D.createContext(void 0);
Cf.displayName = "FrameworkContext";

function ps() {
    let n = D.useContext(Cf);
    return wf(n, "You must render this element inside a <HydratedRouter> element"), n
}

function e1(n, i) {
    let r = D.useContext(Cf), [u, o] = D.useState(!1), [f, d] = D.useState(!1), {
        onFocus: m,
        onBlur: y,
        onMouseEnter: v,
        onMouseLeave: b,
        onTouchStart: S
    } = i, T = D.useRef(null);
    D.useEffect(() => {
        if (n === "render" && d(!0), n === "viewport") {
            let V = J => {
                J.forEach(G => {
                    d(G.isIntersecting)
                })
            }, U = new IntersectionObserver(V, {threshold: .5});
            return T.current && U.observe(T.current), () => {
                U.disconnect()
            }
        }
    }, [n]), D.useEffect(() => {
        if (u) {
            let V = setTimeout(() => {
                d(!0)
            }, 100);
            return () => {
                clearTimeout(V)
            }
        }
    }, [u]);
    let R = () => {
        o(!0)
    }, q = () => {
        o(!1), d(!1)
    };
    return r ? n !== "intent" ? [f, T, {}] : [f, T, {
        onFocus: mr(m, R),
        onBlur: mr(y, q),
        onMouseEnter: mr(v, R),
        onMouseLeave: mr(b, q),
        onTouchStart: mr(S, R)
    }] : [!1, T, {}]
}

function mr(n, i) {
    return r => {
        n && n(r), r.defaultPrevented || i(r)
    }
}

function t1({page: n, ...i}) {
    let r = fS(), {nonce: u} = ps(), {router: o} = Nf(),
        f = D.useMemo(() => bv(o.routes, n, o.basename), [o.routes, n, o.basename]);
    return f ? (i.nonce == null && u && (i = {...i, nonce: u}), r ? D.createElement(a1, {
        page: n,
        matches: f, ...i
    }) : D.createElement(i1, {page: n, matches: f, ...i})) : null
}

function n1(n) {
    let {manifest: i, routeModules: r} = ps(), [u, o] = D.useState([]);
    return D.useEffect(() => {
        let f = !1;
        return XS(n, i, r).then(d => {
            f || o(d)
        }), () => {
            f = !0
        }
    }, [n, i, r]), u
}

function a1({page: n, matches: i, ...r}) {
    let u = Fn(), {future: o} = ps(), {basename: f} = Nf(), d = D.useMemo(() => {
        if (n === u.pathname + u.search + u.hash) return [];
        let m = Lv(n, f, o.v8_trailingSlashAwareDataRequests, "rsc"), y = !1, v = [];
        for (let b of i) typeof b.route.shouldRevalidate == "function" ? y = !0 : v.push(b.route.id);
        return y && v.length > 0 && m.searchParams.set("_routes", v.join(",")), [m.pathname + m.search]
    }, [f, o.v8_trailingSlashAwareDataRequests, n, u, i]);
    return D.createElement(D.Fragment, null, d.map(m => D.createElement("link", {
        key: m,
        rel: "prefetch",
        as: "fetch",
        href: m, ...r
    })))
}

function i1({page: n, matches: i, ...r}) {
    let u = Fn(), {future: o, manifest: f, routeModules: d} = ps(), {basename: m} = Nf(), {
            loaderData: y,
            matches: v
        } = WS(), b = D.useMemo(() => yy(n, i, v, f, u, "data"), [n, i, v, f, u]),
        S = D.useMemo(() => yy(n, i, v, f, u, "assets"), [n, i, v, f, u]), T = D.useMemo(() => {
            if (n === u.pathname + u.search + u.hash) return [];
            let V = new Set, U = !1;
            if (i.forEach(G => {
                let W = f.routes[G.route.id];
                !W || !W.hasLoader || (!b.some(Y => Y.route.id === G.route.id) && G.route.id in y && d[G.route.id]?.shouldRevalidate || W.hasClientLoader ? U = !0 : V.add(G.route.id))
            }), V.size === 0) return [];
            let J = Lv(n, m, o.v8_trailingSlashAwareDataRequests, "data");
            return U && V.size > 0 && J.searchParams.set("_routes", i.filter(G => V.has(G.route.id)).map(G => G.route.id).join(",")), [J.pathname + J.search]
        }, [m, o.v8_trailingSlashAwareDataRequests, y, u, f, b, i, n, d]), R = D.useMemo(() => JS(S, f), [S, f]), q = n1(S);
    return D.createElement(D.Fragment, null, T.map(V => D.createElement("link", {
        key: V,
        rel: "prefetch",
        as: "fetch",
        href: V, ...r
    })), R.map(V => D.createElement("link", {key: V, rel: "modulepreload", href: V, ...r})), q.map(({
                                                                                                        key: V,
                                                                                                        link: U
                                                                                                    }) => D.createElement("link", {
        key: V,
        nonce: r.nonce, ...U,
        crossOrigin: U.crossOrigin ?? r.crossOrigin
    })))
}

function l1(...n) {
    return i => {
        n.forEach(r => {
            typeof r == "function" ? r(i) : r != null && (r.current = i)
        })
    }
}

var r1 = typeof window < "u" && typeof window.document < "u" && typeof window.document.createElement < "u";
try {
    r1 && (window.__reactRouterVersion = "7.18.0")
} catch {
}

function u1({basename: n, children: i, useTransitions: r, window: u}) {
    let o = D.useRef();
    o.current == null && (o.current = L_({window: u, v5Compat: !0}));
    let f = o.current, [d, m] = D.useState({action: f.action, location: f.location}), y = D.useCallback(v => {
        r === !1 ? m(v) : D.startTransition(() => m(v))
    }, [r]);
    return D.useLayoutEffect(() => f.listen(y), [f, y]), D.createElement(ZS, {
        basename: n,
        children: i,
        location: d.location,
        navigationType: d.action,
        navigator: f,
        useTransitions: r
    })
}

var Rr = D.forwardRef(function ({
                                    onClick: i,
                                    discover: r = "render",
                                    prefetch: u = "none",
                                    relative: o,
                                    reloadDocument: f,
                                    replace: d,
                                    mask: m,
                                    state: y,
                                    target: v,
                                    to: b,
                                    preventScrollReset: S,
                                    viewTransition: T,
                                    defaultShouldRevalidate: R,
                                    ...q
                                }, V) {
    let {basename: U, navigator: J, useTransitions: G} = D.useContext(fn), W = typeof b == "string" && Of.test(b),
        Y = Tv(b, U);
    b = Y.to;
    let te = gS(b, {relative: o}), Te = Fn(), le = null;
    if (m) {
        let ge = ds(m, [], Te.mask ? Te.mask.pathname : "/", !0);
        U !== "/" && (ge.pathname = ge.pathname === "/" ? U : Un([U, ge.pathname])), le = J.createHref(ge)
    }
    let [be, qe, Le] = e1(u, q), Ie = f1(b, {
        replace: d,
        mask: m,
        state: y,
        target: v,
        preventScrollReset: S,
        relative: o,
        viewTransition: T,
        defaultShouldRevalidate: R,
        useTransitions: G
    });

    function fe(ge) {
        i && i(ge), ge.defaultPrevented || Ie(ge)
    }

    let de = !(Y.isExternal || f), je = D.createElement("a", {
        ...q, ...Le,
        href: (de ? le : void 0) || Y.absoluteURL || te,
        onClick: de ? fe : i,
        ref: l1(V, qe),
        target: v,
        "data-discover": !W && r === "render" ? "true" : void 0
    });
    return be && !W ? D.createElement(D.Fragment, null, je, D.createElement(t1, {page: te})) : je
});
Rr.displayName = "Link";
var s1 = D.forwardRef(function ({
                                    "aria-current": i = "page",
                                    caseSensitive: r = !1,
                                    className: u = "",
                                    end: o = !1,
                                    style: f,
                                    to: d,
                                    viewTransition: m,
                                    children: y,
                                    ...v
                                }, b) {
    let S = Ar(d, {relative: v.relative}), T = Fn(), R = D.useContext(hs), {
            navigator: q,
            basename: V
        } = D.useContext(fn), U = R != null && y1(S) && m === !0,
        J = q.encodeLocation ? q.encodeLocation(S).pathname : S.pathname, G = T.pathname,
        W = R && R.navigation && R.navigation.location ? R.navigation.location.pathname : null;
    r || (G = G.toLowerCase(), W = W ? W.toLowerCase() : null, J = J.toLowerCase()), W && V && (W = pa(W, V) || W);
    const Y = J !== "/" && J.endsWith("/") ? J.length - 1 : J.length;
    let te = G === J || !o && G.startsWith(J) && G.charAt(Y) === "/",
        Te = W != null && (W === J || !o && W.startsWith(J) && W.charAt(J.length) === "/"),
        le = {isActive: te, isPending: Te, isTransitioning: U}, be = te ? i : void 0, qe;
    typeof u == "function" ? qe = u(le) : qe = [u, te ? "active" : null, Te ? "pending" : null, U ? "transitioning" : null].filter(Boolean).join(" ");
    let Le = typeof f == "function" ? f(le) : f;
    return D.createElement(Rr, {
        ...v,
        "aria-current": be,
        className: qe,
        ref: b,
        style: Le,
        to: d,
        viewTransition: m
    }, typeof y == "function" ? y(le) : y)
});
s1.displayName = "NavLink";
var o1 = D.forwardRef(({
                           discover: n = "render",
                           fetcherKey: i,
                           navigate: r,
                           reloadDocument: u,
                           replace: o,
                           state: f,
                           method: d = Wu,
                           action: m,
                           onSubmit: y,
                           relative: v,
                           preventScrollReset: b,
                           viewTransition: S,
                           defaultShouldRevalidate: T,
                           ...R
                       }, q) => {
    let {useTransitions: V} = D.useContext(fn), U = m1(), J = p1(m, {relative: v}),
        G = d.toLowerCase() === "get" ? "get" : "post", W = typeof m == "string" && Of.test(m), Y = te => {
            if (y && y(te), te.defaultPrevented) return;
            te.preventDefault();
            let Te = te.nativeEvent.submitter, le = Te?.getAttribute("formmethod") || d,
                be = () => U(Te || te.currentTarget, {
                    fetcherKey: i,
                    method: le,
                    navigate: r,
                    replace: o,
                    state: f,
                    relative: v,
                    preventScrollReset: b,
                    viewTransition: S,
                    defaultShouldRevalidate: T
                });
            V && r !== !1 ? D.startTransition(() => be()) : be()
        };
    return D.createElement("form", {
        ref: q,
        method: G,
        action: J,
        onSubmit: u ? y : Y, ...R,
        "data-discover": !W && n === "render" ? "true" : void 0
    })
});
o1.displayName = "Form";

function c1(n) {
    return `${n} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`
}

function qv(n) {
    let i = D.useContext(yl);
    return at(i, c1(n)), i
}

function f1(n, {
    target: i,
    replace: r,
    mask: u,
    state: o,
    preventScrollReset: f,
    relative: d,
    viewTransition: m,
    defaultShouldRevalidate: y,
    useTransitions: v
} = {}) {
    let b = jr(), S = Fn(), T = Ar(n, {relative: d});
    return D.useCallback(R => {
        if (VS(R, i)) {
            R.preventDefault();
            let q = r !== void 0 ? r : xr(S) === xr(T), V = () => b(n, {
                replace: q,
                mask: u,
                state: o,
                preventScrollReset: f,
                relative: d,
                viewTransition: m,
                defaultShouldRevalidate: y
            });
            v ? D.startTransition(() => V()) : V()
        }
    }, [S, b, T, r, u, o, i, n, f, d, m, y, v])
}

var d1 = 0, h1 = () => `__${String(++d1)}__`;

function m1() {
    let {router: n} = qv("useSubmit"), {basename: i} = D.useContext(fn), r = NS(), u = n.fetch, o = n.navigate;
    return D.useCallback(async (f, d = {}) => {
        let {action: m, method: y, encType: v, formData: b, body: S} = YS(f, i);
        if (d.navigate === !1) {
            let T = d.fetcherKey || h1();
            await u(T, r, d.action || m, {
                defaultShouldRevalidate: d.defaultShouldRevalidate,
                preventScrollReset: d.preventScrollReset,
                formData: b,
                body: S,
                formMethod: d.method || y,
                formEncType: d.encType || v,
                flushSync: d.flushSync
            })
        } else await o(d.action || m, {
            defaultShouldRevalidate: d.defaultShouldRevalidate,
            preventScrollReset: d.preventScrollReset,
            formData: b,
            body: S,
            formMethod: d.method || y,
            formEncType: d.encType || v,
            replace: d.replace,
            state: d.state,
            fromRouteId: r,
            flushSync: d.flushSync,
            viewTransition: d.viewTransition
        })
    }, [u, o, i, r])
}

function p1(n, {relative: i} = {}) {
    let {basename: r} = D.useContext(fn), u = D.useContext(jn);
    at(u, "useFormAction must be used inside a RouteContext");
    let [o] = u.matches.slice(-1), f = {...Ar(n || ".", {relative: i})}, d = Fn();
    if (n == null) {
        f.search = d.search;
        let m = new URLSearchParams(f.search), y = m.getAll("index");
        if (y.some(b => b === "")) {
            m.delete("index"), y.filter(S => S).forEach(S => m.append("index", S));
            let b = m.toString();
            f.search = b ? `?${b}` : ""
        }
    }
    return (!n || n === ".") && o.route.index && (f.search = f.search ? f.search.replace(/^\?/, "?index&") : "?index"), r !== "/" && (f.pathname = f.pathname === "/" ? r : Un([r, f.pathname])), xr(f)
}

function y1(n, {relative: i} = {}) {
    let r = D.useContext(Rv);
    at(r != null, "`useViewTransitionState` must be used within `react-router-dom`'s `RouterProvider`.  Did you accidentally import `RouterProvider` from `react-router`?");
    let {basename: u} = qv("useViewTransitionState"), o = Ar(n, {relative: i});
    if (!r.isTransitioning) return !1;
    let f = pa(r.currentLocation.pathname, u) || r.currentLocation.pathname,
        d = pa(r.nextLocation.pathname, u) || r.nextLocation.pathname;
    return is(o.pathname, d) != null || is(o.pathname, f) != null
}

var wr = n => n.type === "checkbox", mi = n => n instanceof Date, Dt = n => n == null;
const Bv = n => typeof n == "object";
var rt = n => !Dt(n) && !Array.isArray(n) && Bv(n) && !mi(n),
    v1 = n => rt(n) && n.target ? wr(n.target) ? n.target.checked : n.target.value : n,
    g1 = (n, i) => i.split(".").some((r, u, o) => !isNaN(Number(r)) && n.has(o.slice(0, u).join("."))), kv = n => {
        const i = n.constructor && n.constructor.prototype;
        return rt(i) && i.hasOwnProperty("isPrototypeOf")
    }, ys = typeof window < "u" && typeof window.HTMLElement < "u" && typeof document < "u";

function pt(n) {
    if (n instanceof Date) return new Date(n);
    const i = typeof FileList < "u" && n instanceof FileList;
    if (ys && (n instanceof Blob || i)) return n;
    const r = Array.isArray(n);
    if (!r && !(rt(n) && kv(n))) return n;
    const u = r ? [] : Object.create(Object.getPrototypeOf(n));
    for (const o in n) Object.prototype.hasOwnProperty.call(n, o) && (u[o] = pt(n[o]));
    return u
}

const sl = {BLUR: "blur", FOCUS_OUT: "focusout", SUBMIT: "submit", TRIGGER: "trigger", VALID: "valid"},
    Mn = {onBlur: "onBlur", onChange: "onChange", onSubmit: "onSubmit", onTouched: "onTouched", all: "all"}, Dn = {
        max: "max",
        min: "min",
        maxLength: "maxLength",
        minLength: "minLength",
        pattern: "pattern",
        required: "required",
        validate: "validate"
    }, Kc = "form", Hv = "root", Vv = ["__proto__", "constructor", "prototype"];
var Nr = n => /^\w*$/.test(n), tt = n => n === void 0, vs = n => n.split(/[.[\]'"]/g).filter(Boolean),
    ie = (n, i, r) => {
        if (!i || !rt(n)) return r;
        const u = Nr(i) ? [i] : vs(i);
        if (u.some(f => Vv.includes(f))) return r;
        const o = u.reduce((f, d) => Dt(f) ? void 0 : f[d], n);
        return tt(o) || o === n ? tt(n[i]) ? r : n[i] : o
    }, Yn = n => typeof n == "boolean", Tn = n => typeof n == "function", Xe = (n, i, r) => {
        let u = -1;
        const o = Nr(i) ? [i] : vs(i), f = o.length, d = f - 1;
        for (; ++u < f;) {
            const m = o[u];
            let y = r;
            if (u !== d) {
                const v = n[m];
                y = rt(v) || Array.isArray(v) ? v : isNaN(+o[u + 1]) ? {} : []
            }
            if (Vv.includes(m)) return;
            n[m] = y, n = n[m]
        }
    };
const b1 = Zt.createContext(null);
b1.displayName = "HookFormControlContext";
var _1 = (n, i, r, u = !0) => {
    const o = {};
    for (const f in n) Object.defineProperty(o, f, {
        get: () => {
            const d = f;
            return i._proxyFormState[d] !== Mn.all && (i._proxyFormState[d] = !u || Mn.all), n[d]
        }
    });
    return o
};
const S1 = ys ? Zt.useLayoutEffect : Zt.useEffect;
var Lt = n => typeof n == "string",
    E1 = (n, i, r, u, o) => Lt(n) ? (u && i.watch.add(n), ie(r, n, o)) : Array.isArray(n) ? n.map(f => (u && i.watch.add(f), ie(r, f))) : (u && (i.watchAll = !0), r),
    ff = n => Dt(n) || !Bv(n);
const vy = (n, i) => i.length === 0 && !Array.isArray(n) && !kv(n);

function Gn(n, i, r = new WeakMap) {
    if (n === i) return !0;
    if (ff(n) || ff(i)) return Object.is(n, i);
    if (mi(n) && mi(i)) return Object.is(n.getTime(), i.getTime());
    const u = Object.keys(n), o = Object.keys(i);
    if (u.length !== o.length) return !1;
    if (vy(n, u) || vy(i, o)) return Object.is(n, i);
    const f = r.get(n);
    if (f && f.has(i)) return !0;
    f ? f.add(i) : r.set(n, new WeakSet([i]));
    for (const d of u) {
        const m = n[d];
        if (!(d in i)) return !1;
        if (d !== "ref") {
            const y = i[d];
            if (mi(m) && mi(y) || (rt(m) || Array.isArray(m)) && (rt(y) || Array.isArray(y)) ? !Gn(m, y, r) : !Object.is(m, y)) return !1
        }
    }
    return !0
}

const x1 = Zt.createContext(null);
x1.displayName = "HookFormContext";
var Df = (n, i, r, u, o) => i ? {...r[n], types: {...r[n] && r[n].types ? r[n].types : {}, [u]: o || !0}} : {},
    $v = n => Array.isArray(n) ? n.filter(Boolean) : [], ts = n => Array.isArray(n) ? n : [n], gy = () => {
        let n = [];
        return {
            get observers() {
                return n
            }, next: o => {
                for (const f of n) f.next && f.next(o)
            }, subscribe: o => (n.push(o), {
                unsubscribe: () => {
                    n = n.filter(f => f !== o)
                }
            }), unsubscribe: () => {
                n = []
            }
        }
    };

function Qv(n, i) {
    const r = {};
    for (const u in n) if (n.hasOwnProperty(u)) {
        const o = n[u], f = i[u];
        if (o && rt(o) && f) {
            const d = Qv(o, f);
            rt(d) && (r[u] = d)
        } else n[u] && (r[u] = f)
    }
    return r
}

var jt = n => rt(n) && !Object.keys(n).length, Mf = n => n.type === "file", rs = n => {
        if (!ys) return !1;
        const i = n ? n.ownerDocument : 0;
        return n instanceof (i && i.defaultView ? i.defaultView.HTMLElement : HTMLElement)
    }, Yv = n => n.type === "select-multiple", Uf = n => n.type === "radio", z1 = n => Uf(n) || wr(n),
    Pc = n => rs(n) && n.isConnected;

function O1(n, i) {
    const r = i.slice(0, -1).length;
    let u = 0;
    for (; u < r;) {
        if (Dt(n)) {
            n = void 0;
            break
        }
        n = n[i[u]], u++
    }
    return n
}

function T1(n) {
    for (const i in n) if (n.hasOwnProperty(i) && !tt(n[i])) return !1;
    return !0
}

function St(n, i) {
    if (Lt(i) && Object.prototype.hasOwnProperty.call(n, i)) return delete n[i], n;
    const r = Array.isArray(i) ? i : Nr(i) ? [i] : vs(i), u = r.length === 1 ? n : O1(n, r), o = r.length - 1, f = r[o];
    return u && delete u[f], o !== 0 && (rt(u) && jt(u) || Array.isArray(u) && T1(u)) && St(n, r.slice(0, -1)), n
}

var j1 = n => {
    for (const i in n) if (Tn(n[i])) return !0;
    return !1
};

function Gv(n) {
    return Array.isArray(n) || rt(n) && !j1(n)
}

function df(n, i = {}) {
    for (const r in n) {
        const u = n[r];
        Gv(u) ? (i[r] = Array.isArray(u) ? [] : {}, df(u, i[r])) : tt(u) || (i[r] = !0)
    }
    return i
}

function hf(n) {
    if (n !== !1) {
        if (n === !0) return !0;
        if (Array.isArray(n)) {
            const i = n.map(r => hf(r));
            return i.some(r => r !== void 0) ? i : void 0
        }
        if (rt(n)) {
            const i = {};
            for (const r in n) {
                const u = hf(n[r]);
                tt(u) || (i[r] = u)
            }
            return Object.keys(i).length ? i : void 0
        }
    }
}

function di(n, i, r) {
    r || (r = df(i));
    for (const u in n) {
        const o = n[u];
        if (Gv(o)) tt(i) || ff(r[u]) ? r[u] = df(o, Array.isArray(o) ? [] : {}) : di(o, Dt(i) ? {} : i[u], r[u]); else {
            const f = i[u];
            r[u] = !Gn(o, f)
        }
    }
    return hf(r) || {}
}

const by = {value: !1, isValid: !1}, _y = {value: !0, isValid: !0};
var Fv = n => {
    if (Array.isArray(n)) {
        if (n.length > 1) {
            const i = n.filter(r => r && r.checked && !r.disabled).map(r => r.value);
            return {value: i, isValid: !!i.length}
        }
        return n[0].checked && !n[0].disabled ? n[0].attributes && !tt(n[0].attributes.value) ? tt(n[0].value) || n[0].value === "" ? _y : {
            value: n[0].value,
            isValid: !0
        } : _y : by
    }
    return by
}, Xv = (n, {
    valueAsNumber: i,
    valueAsDate: r,
    setValueAs: u
}) => tt(n) ? n : i ? n === "" ? NaN : n && +n : r && Lt(n) ? new Date(n) : u ? u(n) : n;
const Sy = {isValid: !1, value: null};
var Jv = n => Array.isArray(n) ? n.reduce((i, r) => r && r.checked && !r.disabled ? {
    isValid: !0,
    value: r.value
} : i, Sy) : Sy;

function Ey(n) {
    const i = n.ref;
    return Mf(i) ? i.files : Uf(i) ? Jv(n.refs).value : Yv(i) ? [...i.selectedOptions].map(({value: r}) => r) : wr(i) ? Fv(n.refs).value : Xv(tt(i.value) ? n.ref.value : i.value, n)
}

var A1 = (n, i, r, u) => {
        const o = {};
        for (const f of n) {
            const d = ie(i, f);
            d && Xe(o, f, d._f)
        }
        return {criteriaMode: r, names: [...n], fields: o, shouldUseNativeValidation: u}
    }, us = n => n instanceof RegExp,
    pr = n => tt(n) ? n : us(n) ? n.source : rt(n) ? us(n.value) ? n.value.source : n.value : n, xy = n => ({
        isOnSubmit: !n || n === Mn.onSubmit,
        isOnBlur: n === Mn.onBlur,
        isOnChange: n === Mn.onChange,
        isOnAll: n === Mn.all,
        isOnTouch: n === Mn.onTouched
    });
const zy = "AsyncFunction";
var R1 = n => !!n && !!n.validate && !!(Tn(n.validate) && n.validate.constructor.name === zy || rt(n.validate) && Object.values(n.validate).find(i => i.constructor.name === zy)),
    w1 = n => n.mount && (n.required || n.min || n.max || n.maxLength || n.minLength || n.pattern || n.validate),
    Ic = (n, i, r) => !r && (i.watchAll || i.watch.has(n) || [...i.watch].some(u => n.startsWith(`${u}.`)));
const _r = (n, i, r, u) => {
    for (const o of r || Object.keys(n)) {
        const f = ie(n, o);
        if (f) {
            const {_f: d, ...m} = f;
            if (d) {
                if (d.refs && d.refs[0] && i(d.refs[0], o) && !u) return !0;
                if (d.ref && i(d.ref, d.name) && !u) return !0;
                if (_r(m, i)) break
            } else if (rt(m) && _r(m, i)) break
        }
    }
};

function Oy(n, i, r) {
    const u = ie(n, r);
    if (u || Nr(r)) return {error: u, name: r};
    const o = r.split(".");
    for (; o.length;) {
        const f = o.join("."), d = ie(i, f), m = ie(n, f);
        if (d && !Array.isArray(d) && r !== f) return {name: r};
        if (m && m.type) return {name: f, error: m};
        if (m && m.root && m.root.type) return {name: `${f}.root`, error: m.root};
        o.pop()
    }
    return {name: r}
}

var N1 = (n, i, r, u) => {
        r(n);
        const {name: o, ...f} = n;
        return jt(f) || u && Object.keys(f).length >= Object.keys(i).length || Object.keys(f).find(d => i[d] === (!u || Mn.all))
    }, C1 = (n, i, r) => !n || !i || n === i || ts(n).some(u => u && (r ? u === i : u.startsWith(i) || i.startsWith(u))),
    D1 = (n, i, r, u, o) => o.isOnAll ? !1 : !r && o.isOnTouch ? !(i || n) : (r ? u.isOnBlur : o.isOnBlur) ? !n : (r ? u.isOnChange : o.isOnChange) ? n : !0,
    M1 = (n, i) => !$v(ie(n, i)).length && St(n, i), Ty = (n, i, r) => {
        const u = ie(n, r), o = Array.isArray(u) ? u : [];
        return Xe(o, Hv, i[r]), Xe(n, r, o), n
    };

function jy(n, i, r = "validate") {
    if (Lt(n) || Array.isArray(n) && n.every(Lt) || Yn(n) && !n) return {type: r, message: Lt(n) ? n : "", ref: i}
}

var ol = n => rt(n) && !us(n) ? n : {value: n, message: ""}, Ay = async (n, i, r, u, o, f) => {
    const {
        ref: d,
        refs: m,
        required: y,
        maxLength: v,
        minLength: b,
        min: S,
        max: T,
        pattern: R,
        validate: q,
        name: V,
        valueAsNumber: U,
        mount: J
    } = n._f, G = ie(r, V);
    if (!J || i.has(V)) return {};
    const W = m ? m[0] : d, Y = fe => {
            if (o && W.reportValidity) {
                const de = Yn(fe) ? "" : fe || "";
                m ? m.forEach(je => je.setCustomValidity(de)) : W.setCustomValidity(de), W.reportValidity()
            }
        }, te = {}, Te = Uf(d), le = wr(d), be = Te || le,
        qe = (U || Mf(d)) && tt(d.value) && tt(G) || rs(d) && d.value === "" || G === "" || Array.isArray(G) && !G.length,
        Le = Df.bind(null, V, u, te), Ie = (fe, de, je, ge = Dn.maxLength, Z = Dn.minLength) => {
            const K = fe ? de : je;
            te[V] = {type: fe ? ge : Z, message: K, ref: d, ...Le(fe ? ge : Z, K)}
        };
    if (f ? !Array.isArray(G) || !G.length : y && (!be && (qe || Dt(G)) || Yn(G) && !G || le && !Fv(m).isValid || Te && !Jv(m).isValid)) {
        const {value: fe, message: de} = Lt(y) ? {value: !!y, message: y} : ol(y);
        if (fe && (te[V] = {type: Dn.required, message: de, ref: W, ...Le(Dn.required, de)}, !u)) return Y(de), te
    }
    if (!qe && (!Dt(S) || !Dt(T))) {
        let fe, de;
        const je = ol(T), ge = ol(S);
        if (!Dt(G) && !isNaN(G)) {
            const Z = d.valueAsNumber || G && +G;
            Dt(je.value) || (fe = Z > je.value), Dt(ge.value) || (de = Z < ge.value)
        } else {
            const Z = d.valueAsDate || new Date(G), K = Ae => new Date(new Date().toDateString() + " " + Ae),
                ue = d.type == "time", xe = d.type == "week";
            Lt(je.value) && G && (fe = ue ? K(G) > K(je.value) : xe ? G > je.value : Z > new Date(je.value)), Lt(ge.value) && G && (de = ue ? K(G) < K(ge.value) : xe ? G < ge.value : Z < new Date(ge.value))
        }
        if ((fe || de) && (Ie(!!fe, je.message, ge.message, Dn.max, Dn.min), !u)) return Y(te[V].message), te
    }
    if ((v || b) && !qe && (Lt(G) || f && Array.isArray(G))) {
        const fe = ol(v), de = ol(b), je = !Dt(fe.value) && G.length > +fe.value,
            ge = !Dt(de.value) && G.length < +de.value;
        if ((je || ge) && (Ie(je, fe.message, de.message), !u)) return Y(te[V].message), te
    }
    if (R && !qe && Lt(G)) {
        const {value: fe, message: de} = ol(R);
        if (us(fe) && !G.match(fe) && (te[V] = {
            type: Dn.pattern,
            message: de,
            ref: d, ...Le(Dn.pattern, de)
        }, !u)) return Y(de), te
    }
    if (q) {
        if (Tn(q)) {
            const fe = await q(G, r), de = jy(fe, W);
            if (de && (te[V] = {...de, ...Le(Dn.validate, de.message)}, !u)) return Y(de.message), te
        } else if (rt(q)) {
            let fe = {};
            for (const de in q) {
                if (!jt(fe) && !u) break;
                const je = jy(await q[de](G, r), W, de);
                je && (fe = {...je, ...Le(de, je.message)}, Y(je.message), u && (te[V] = fe))
            }
            if (!jt(fe) && (te[V] = {ref: W, ...fe}, !u)) return te
        }
    }
    return Y(!0), te
};
const U1 = {mode: Mn.onSubmit, reValidateMode: Mn.onChange, shouldFocusError: !0}, Kv = {
    submitCount: 0,
    isDirty: !1,
    isReady: !1,
    isValidating: !1,
    isSubmitted: !1,
    isSubmitting: !1,
    isSubmitSuccessful: !1,
    isValid: !1,
    touchedFields: {},
    dirtyFields: {},
    validatingFields: {}
};

function Z1(n = {}) {
    let i = {...U1, ...n},
        r = {...pt(Kv), isLoading: Tn(i.defaultValues), errors: i.errors || {}, disabled: i.disabled || !1}, u = {},
        o = rt(i.defaultValues) || rt(i.values) ? pt(i.defaultValues || i.values) || {} : {},
        f = i.shouldUnregister ? {} : pt(o), d = {action: !1, mount: !1, watch: !1, keepIsValid: !1}, m = {
            mount: new Set,
            disabled: new Set,
            unMount: new Set,
            array: new Set,
            watch: new Set,
            registerName: new Set
        }, y, v = 0;
    const b = {
        isDirty: !1,
        dirtyFields: !1,
        validatingFields: !1,
        touchedFields: !1,
        isValidating: !1,
        isValid: !1,
        errors: !1
    }, S = {...b};
    let T = {...S};
    const R = {array: gy(), state: gy()}, q = i.criteriaMode === Mn.all, V = _ => j => {
            clearTimeout(v), v = setTimeout(_, j)
        }, U = async _ => {
            if (!d.keepIsValid && !i.disabled && (S.isValid || T.isValid || _)) {
                let j;
                i.resolver ? (j = jt((await Le()).errors), J()) : j = await de({
                    fields: u,
                    onlyCheckValid: !0,
                    eventType: sl.VALID
                }), j !== r.isValid && R.state.next({isValid: j})
            }
        }, J = (_, j) => {
            !i.disabled && (S.isValidating || S.validatingFields || T.isValidating || T.validatingFields) && ((_ || Array.from(m.mount)).forEach(w => {
                w && (j ? Xe(r.validatingFields, w, j) : St(r.validatingFields, w))
            }), R.state.next({validatingFields: r.validatingFields, isValidating: !jt(r.validatingFields)}))
        }, G = () => {
            r.dirtyFields = di(o, f)
        }, W = (_, j = [], w, X, ee = !0, ne = !0) => {
            if (X && w && !i.disabled) {
                if (d.action = !0, ne && Array.isArray(ie(u, _))) {
                    const P = w(ie(u, _), X.argA, X.argB);
                    ee && Xe(u, _, P)
                }
                if (ne && Array.isArray(ie(r.errors, _))) {
                    const P = w(ie(r.errors, _), X.argA, X.argB);
                    ee && Xe(r.errors, _, P), M1(r.errors, _)
                }
                if ((S.touchedFields || T.touchedFields) && ne && Array.isArray(ie(r.touchedFields, _))) {
                    const P = w(ie(r.touchedFields, _), X.argA, X.argB);
                    ee && Xe(r.touchedFields, _, P)
                }
                (S.dirtyFields || T.dirtyFields) && G(), R.state.next({
                    name: _,
                    isDirty: ge(_, j),
                    dirtyFields: r.dirtyFields,
                    errors: r.errors,
                    isValid: r.isValid
                })
            } else Xe(f, _, j)
        }, Y = (_, j) => {
            Xe(r.errors, _, j), r.errors = {...r.errors}, R.state.next({errors: r.errors})
        }, te = _ => {
            r.errors = _, R.state.next({errors: r.errors, isValid: !1})
        }, Te = _ => {
            const j = Nr(_) ? [_] : vs(_);
            let w = f, X = o;
            for (let ee = 0; ee < j.length - 1; ee++) {
                const ne = j[ee];
                if (w = Dt(w) ? w : w[ne], X = Dt(X) ? X : X[ne], w === null && X !== null) return !0
            }
            return !1
        }, le = (_, j, w, X) => {
            const ee = ie(u, _);
            if (ee) {
                if (Te(_)) return;
                const ne = tt(ie(f, _)), P = ie(f, _, tt(w) ? ie(o, _) : w);
                tt(P) || X && X.defaultChecked || j ? Xe(f, _, j ? P : Ey(ee._f)) : ue(_, P), d.mount && !d.action && (U(), ne && r.isDirty && (S.isDirty || T.isDirty) && (ge() || (r.isDirty = !1, R.state.next({...r}))), n.shouldUnregister && ne && !tt(ie(f, _)) && Ic(_, m) && (d.watch = !0))
            }
        }, be = (_, j, w, X, ee) => {
            let ne = !1, P = !1;
            const ae = {name: _};
            if (!i.disabled) {
                if (!w || X) {
                    (S.isDirty || T.isDirty) && (P = r.isDirty, r.isDirty = ae.isDirty = ge(), ne = P !== ae.isDirty);
                    const Se = Gn(ie(o, _), j);
                    P = !!ie(r.dirtyFields, _), Se !== r.isDirty ? r.dirtyFields = di(o, f) : Se ? St(r.dirtyFields, _) : Xe(r.dirtyFields, _, !0), ae.dirtyFields = r.dirtyFields, ne = ne || (S.dirtyFields || T.dirtyFields) && P !== !Se
                }
                if (w) {
                    const Se = ie(r.touchedFields, _);
                    Se || (Xe(r.touchedFields, _, w), ae.touchedFields = r.touchedFields, ne = ne || (S.touchedFields || T.touchedFields) && Se !== w)
                }
                ne && ee && R.state.next(ae)
            }
            return ne ? ae : {}
        }, qe = (_, j, w, X) => {
            const ee = ie(r.errors, _), ne = (S.isValid || T.isValid) && Yn(j) && r.isValid !== j;
            if (i.delayError && w ? (y = V(() => Y(_, w)), y(i.delayError)) : (clearTimeout(v), y = null, w ? Xe(r.errors, _, w) : St(r.errors, _), r.errors = {...r.errors}), (w ? !Gn(ee, w) : ee) || !jt(X) || ne) {
                const P = {...X, ...ne && Yn(j) ? {isValid: j} : {}, errors: r.errors, name: _};
                r = {...r, ...P}, R.state.next(P)
            }
        },
        Le = async _ => (J(_, !0), await i.resolver(f, i.context, A1(_ || m.mount, u, i.criteriaMode, i.shouldUseNativeValidation))),
        Ie = async _ => {
            const {errors: j} = await Le(_);
            if (J(_), _) {
                for (const w of _) {
                    const X = ie(j, w);
                    X ? m.array.has(w) && rt(X) && !Object.keys(X).some(ee => !Number.isNaN(Number(ee))) ? Ty(r.errors, {[w]: X}, w) : Xe(r.errors, w, X) : St(r.errors, w)
                }
                r.errors = {...r.errors}
            } else r.errors = j;
            return j
        }, fe = async ({name: _, eventType: j}) => {
            if (n.validate) {
                const w = await n.validate({formValues: f, formState: r, name: _, eventType: j});
                if (rt(w)) for (const X in w) {
                    const ee = w[X];
                    ee && He(`${Kc}.${X}`, {message: Lt(ee.message) ? ee.message : "", type: ee.type || Dn.validate})
                } else Lt(w) || !w ? He(Kc, {message: w || "", type: Dn.validate}) : lt(Kc);
                return w
            }
            return !0
        }, de = async ({
                           fields: _,
                           onlyCheckValid: j,
                           name: w,
                           eventType: X,
                           context: ee = {valid: !0, runRootValidation: !1}
                       }) => {
            if (n.validate && (ee.runRootValidation = !0, !await fe({
                name: w,
                eventType: X
            }) && (ee.valid = !1, j))) return ee.valid;
            for (const ne in _) {
                const P = _[ne];
                if (P) {
                    const {_f: ae, ...Se} = P;
                    if (ae) {
                        const Ze = m.array.has(ae.name), Qt = P._f && R1(P._f),
                            Wt = S.validatingFields || S.isValidating || T.validatingFields || T.isValidating;
                        Qt && Wt && J([ae.name], !0);
                        const Xn = await Ay(P, m.disabled, f, q, i.shouldUseNativeValidation && !j, Ze);
                        if (Qt && Wt && J([ae.name]), Xn[ae.name] && (ee.valid = !1, j) || (!j && (ie(Xn, ae.name) ? Ze ? Ty(r.errors, Xn, ae.name) : Xe(r.errors, ae.name, Xn[ae.name]) : St(r.errors, ae.name)), n.shouldUseNativeValidation && Xn[ae.name])) break
                    }
                    !jt(Se) && await de({context: ee, onlyCheckValid: j, fields: Se, name: ne, eventType: X})
                }
            }
            return ee.valid
        }, je = () => {
            for (const _ of m.unMount) {
                const j = ie(u, _);
                j && (j._f.refs ? j._f.refs.every(w => !Pc(w)) : !Pc(j._f.ref)) && z(_)
            }
            m.unMount = new Set
        }, ge = (_, j) => !i.disabled && (_ && j && Xe(f, _, j), !Gn(_e(), o)),
        Z = (_, j, w) => E1(_, m, {...d.mount ? f : tt(j) ? o : Lt(_) ? {[_]: j} : j}, w, j),
        K = _ => $v(ie(d.mount ? f : o, _, i.shouldUnregister ? ie(o, _, []) : [])), ue = (_, j, w = {}, X = !1) => {
            const ee = ie(u, _);
            let ne = j;
            if (ee) {
                const P = ee._f;
                P && (!P.disabled && Xe(f, _, Xv(j, P)), ne = rs(P.ref) && Dt(j) ? "" : j, Yv(P.ref) ? [...P.ref.options].forEach(ae => ae.selected = ne.includes(ae.value)) : P.refs ? wr(P.ref) ? P.refs.forEach(ae => {
                    (!ae.defaultChecked || !ae.disabled) && (Array.isArray(ne) ? ae.checked = !!ne.find(Se => Se === ae.value) : ae.checked = ne === ae.value || !!ne)
                }) : P.refs.forEach(ae => ae.checked = ae.value === ne) : Mf(P.ref) ? P.ref.value = "" : (P.ref.value = ne, P.ref.type || R.state.next({
                    name: _,
                    values: X ? f : pt(f)
                })))
            }
            (w.shouldDirty || w.shouldTouch) && be(_, ne, w.shouldTouch, w.shouldDirty, !0), w.shouldValidate && ye(_)
        }, xe = (_, j, w, X = !1) => {
            for (const ee in j) {
                if (!j.hasOwnProperty(ee)) return;
                const ne = j[ee], P = _ + "." + ee, ae = ie(u, P);
                (m.array.has(_) || rt(ne) || ae && !ae._f) && !mi(ne) ? xe(P, ne, w, X) : ue(P, ne, w, X)
            }
        }, Ae = (_, j, w, X) => {
            const ee = ie(u, _), ne = m.array.has(_), P = X ? j : pt(j), ae = ie(f, _), Se = Gn(ae, P);
            if (Se || Xe(f, _, P), ne) R.array.next({
                name: _,
                values: X ? f : pt(f)
            }), (S.isDirty || S.dirtyFields || T.isDirty || T.dirtyFields) && w.shouldDirty && (G(), R.state.next({
                name: _,
                dirtyFields: r.dirtyFields,
                isDirty: ge(_, P)
            })); else {
                const Ze = Array.isArray(P) && !P.length || jt(P);
                !ee || ee._f || Dt(P) || Ze ? ue(_, P, w, X) : xe(_, P, w, X)
            }
            if (!Se) {
                const Ze = Ic(_, m), Qt = X ? f : pt(f);
                R.state.next({...Ze && r, name: d.mount || Ze ? _ : void 0, values: Qt})
            }
        }, x = (_, j, w = {}) => Ae(_, j, w, !1), k = (_, j = {}) => {
            const w = Tn(_) ? _(f) : _;
            if (!Gn(f, w)) {
                f = {...f, ...w};
                for (const X of m.mount) Ae(X, ie(w, X), j, !0);
                R.state.next({...r, name: void 0, type: void 0, values: f}), j.shouldValidate && U()
            }
        }, I = async _ => {
            d.mount = !0;
            const j = _.target;
            let w = j.name, X = !0;
            const ee = ie(u, w), ne = Se => {
                X = Number.isNaN(Se) || mi(Se) && isNaN(Se.getTime()) || Gn(Se, ie(f, w, Se))
            }, P = xy(i.mode), ae = xy(i.reValidateMode);
            if (ee) {
                let Se, Ze;
                const Qt = j.type ? Ey(ee._f) : v1(_), Wt = _.type === sl.BLUR || _.type === sl.FOCUS_OUT,
                    Xn = !w1(ee._f) && !n.validate && !i.resolver && !ie(r.errors, w) && !ee._f.deps || D1(Wt, ie(r.touchedFields, w), r.isSubmitted, ae, P),
                    ya = Ic(w, m, Wt);
                Xe(f, w, Qt), Wt ? (!j || !j.readOnly) && (ee._f.onBlur && ee._f.onBlur(_), y && y(0)) : ee._f.onChange && ee._f.onChange(_);
                const qn = be(w, Qt, Wt), Ei = !jt(qn) || ya;
                if (!Wt && R.state.next({
                    name: w,
                    type: _.type,
                    values: pt(f)
                }), Xn) return (S.isValid || T.isValid) && (i.mode === "onBlur" ? Wt && U() : Wt || U()), Ei && R.state.next({name: w, ...ya ? {} : qn});
                if (!i.resolver && n.validate && await fe({
                    name: w,
                    eventType: _.type
                }), !Wt && ya && R.state.next({...r}), i.resolver) {
                    const {errors: Bn} = await Le([w]);
                    if (J([w]), ne(Qt), !X) {
                        !jt(qn) && R.state.next(qn);
                        return
                    }
                    const xi = Oy(r.errors, u, w), va = Oy(Bn, u, xi.name || w);
                    Se = va.error, w = va.name, Ze = jt(Bn)
                } else J([w], !0), Se = (await Ay(ee, m.disabled, f, q, i.shouldUseNativeValidation))[w], J([w]), ne(Qt), X && (Se ? Ze = !1 : (S.isValid || T.isValid) && (Ze = await de({
                    fields: u,
                    onlyCheckValid: !0,
                    name: w,
                    eventType: _.type
                })));
                X && (ee._f.deps && (!Array.isArray(ee._f.deps) || ee._f.deps.length > 0) && ye(ee._f.deps), qe(w, Ze, Se, qn))
            }
        }, F = (_, j) => {
            if (ie(r.errors, j) && _.focus) return _.focus(), 1
        }, ye = async (_, j = {}) => {
            let w, X;
            const ee = ts(_);
            if (i.resolver) {
                const ne = await Ie(tt(_) ? _ : ee);
                w = jt(ne), X = _ ? !ee.some(P => ie(ne, P)) : w
            } else _ ? (X = (await Promise.all(ee.map(async ne => {
                const P = ie(u, ne);
                return await de({fields: P && P._f ? {[ne]: P} : P, eventType: sl.TRIGGER})
            }))).every(Boolean), !(!X && !r.isValid) && U()) : X = w = await de({
                fields: u,
                name: _,
                eventType: sl.TRIGGER
            });
            return R.state.next({
                ...!Lt(_) || (S.isValid || T.isValid) && w !== r.isValid ? {} : {name: _}, ...i.resolver || !_ ? {isValid: w} : {},
                errors: r.errors
            }), j.shouldFocus && !X && _r(u, F, _ ? ee : m.mount), X
        }, _e = (_, j) => {
            let w = {...d.mount ? f : o};
            return j && (w = Qv(j.dirtyFields ? r.dirtyFields : r.touchedFields, w)), tt(_) ? w : Lt(_) ? ie(w, _) : _.map(X => ie(w, X))
        }, Re = (_, j) => ({
            invalid: !!ie((j || r).errors, _),
            isDirty: !!ie((j || r).dirtyFields, _),
            error: ie((j || r).errors, _),
            isValidating: !!ie(r.validatingFields, _),
            isTouched: !!ie((j || r).touchedFields, _)
        }), lt = _ => {
            const j = _ ? ts(_) : void 0;
            j?.forEach(w => St(r.errors, w)), j ? j.forEach(w => {
                R.state.next({name: w, errors: r.errors})
            }) : R.state.next({errors: {}})
        }, He = (_, j, w) => {
            const X = (ie(u, _, {_f: {}})._f || {}).ref, ee = ie(r.errors, _) || {}, {
                ref: ne,
                message: P,
                type: ae,
                ...Se
            } = ee;
            Xe(r.errors, _, {...Se, ...j, ref: X}), R.state.next({
                name: _,
                errors: r.errors,
                isValid: !1
            }), w && w.shouldFocus && X && X.focus && X.focus()
        },
        dn = (_, j) => Tn(_) ? R.state.subscribe({next: w => "values" in w && _(w.values || Z(void 0, j), w)}) : Z(_, j, !0),
        hn = _ => R.state.subscribe({
            next: j => {
                if (C1(_.name, j.name, _.exact) && N1(j, _.formState || S, js, _.reRenderRoot)) {
                    const w = {...f};
                    _.callback({values: w, ...r, ...j, defaultValues: o})
                }
            }
        }).unsubscribe,
        Ln = _ => (d.mount = !0, T = {...T, ..._.formState}, hn({..._, formState: {...b, ..._.formState}})),
        z = (_, j = {}) => {
            for (const w of _ ? ts(_) : m.mount) m.mount.delete(w), m.array.delete(w), j.keepValue || (St(u, w), St(f, w)), !j.keepError && St(r.errors, w), !j.keepDirty && St(r.dirtyFields, w), !j.keepTouched && St(r.touchedFields, w), !j.keepIsValidating && St(r.validatingFields, w), !i.shouldUnregister && !j.keepDefaultValue && St(o, w);
            R.state.next({values: pt(f)}), R.state.next({...r, ...j.keepDirty ? {isDirty: ge()} : {}}), !j.keepIsValid && U()
        }, st = ({disabled: _, name: j}) => {
            if (Yn(_) && d.mount || _ || m.disabled.has(j)) {
                const ee = m.disabled.has(j) !== !!_;
                _ ? m.disabled.add(j) : m.disabled.delete(j), ee && d.mount && !d.action && U()
            }
        }, Fa = (_, j = {}) => {
            let w = ie(u, _);
            const X = Yn(j.disabled) || Yn(i.disabled), ee = !m.registerName.has(_) && w && w._f && !w._f.mount;
            return Xe(u, _, {
                ...w || {},
                _f: {...w && w._f ? w._f : {ref: {name: _}}, name: _, mount: !0, ...j}
            }), m.mount.add(_), w && !ee ? st({
                disabled: Yn(j.disabled) ? j.disabled : i.disabled,
                name: _
            }) : le(_, !0, j.value), {
                ...X ? {disabled: j.disabled || i.disabled} : {}, ...i.progressive ? {
                    required: !!j.required,
                    min: pr(j.min),
                    max: pr(j.max),
                    minLength: pr(j.minLength),
                    maxLength: pr(j.maxLength),
                    pattern: pr(j.pattern)
                } : {}, name: _, onChange: I, onBlur: I, ref: ne => {
                    if (ne) {
                        m.registerName.add(_), Fa(_, j), m.registerName.delete(_), w = ie(u, _);
                        const P = tt(ne.value) && ne.querySelectorAll && ne.querySelectorAll("input,select,textarea")[0] || ne,
                            ae = z1(P), Se = w._f.refs || [];
                        if (ae ? Se.find(Ze => Ze === P) : P === w._f.ref) return;
                        Xe(u, _, {
                            _f: {
                                ...w._f, ...ae ? {
                                    refs: [...Se.filter(Pc), P, ...Array.isArray(ie(o, _)) ? [{}] : []],
                                    ref: {type: P.type, name: _}
                                } : {ref: P}
                            }
                        }), le(_, !1, void 0, P)
                    } else w = ie(u, _, {}), w._f && (w._f.mount = !1), (i.shouldUnregister || j.shouldUnregister) && !(g1(m.array, _) && d.action) && m.unMount.add(_)
                }
            }
        }, Xa = () => i.shouldFocusError && !i.shouldUseNativeValidation && _r(u, F, m.mount), Os = _ => {
            Yn(_) && (R.state.next({disabled: _}), _r(u, (j, w) => {
                const X = ie(u, w);
                X && (j.disabled = X._f.disabled || _, Array.isArray(X._f.refs) && X._f.refs.forEach(ee => {
                    ee.disabled = X._f.disabled || _
                }))
            }, 0, !1))
        }, bl = (_, j) => async w => {
            let X;
            w && (w.preventDefault && w.preventDefault(), w.persist && w.persist());
            let ee = pt(f);
            if (R.state.next({isSubmitting: !0}), i.resolver) {
                const {errors: ne, values: P} = await Le();
                J(), r.errors = ne, ee = pt(P)
            } else await de({fields: u, eventType: sl.SUBMIT});
            if (m.disabled.size) for (const ne of m.disabled) St(ee, ne);
            if (St(r.errors, Hv), jt(r.errors)) {
                R.state.next({errors: {}});
                try {
                    await _(ee, w)
                } catch (ne) {
                    X = ne
                }
            } else j && await j({...r.errors}, w), Xa(), setTimeout(Xa);
            if (R.state.next({
                isSubmitted: !0,
                isSubmitting: !1,
                isSubmitSuccessful: jt(r.errors) && !X,
                submitCount: r.submitCount + 1,
                errors: r.errors
            }), X) throw X
        }, _l = (_, j = {}) => {
            ie(u, _) && (tt(j.defaultValue) ? x(_, pt(ie(o, _))) : (x(_, j.defaultValue), Xe(o, _, pt(j.defaultValue))), j.keepTouched || St(r.touchedFields, _), j.keepDirty || (St(r.dirtyFields, _), r.isDirty = j.defaultValue ? ge(_, pt(ie(o, _))) : ge()), j.keepError || (St(r.errors, _), S.isValid && U()), R.state.next({...r}))
        }, _i = (_, j = {}) => {
            const w = _ ? pt(_) : o, X = pt(w), ee = jt(_), ne = X;
            if (j.keepDefaultValues || (o = w), !j.keepValues) {
                if (j.keepDirtyValues) {
                    const P = new Set([...m.mount, ...Object.keys(di(o, f))]);
                    for (const ae of Array.from(P)) {
                        const Se = ie(r.dirtyFields, ae), Ze = ie(f, ae), Qt = ie(ne, ae);
                        Se && !tt(Ze) ? Xe(ne, ae, Ze) : !Se && !tt(Qt) && x(ae, Qt)
                    }
                } else {
                    if (ys && tt(_)) for (const P of m.mount) {
                        const ae = ie(u, P);
                        if (ae && ae._f) {
                            const Se = Array.isArray(ae._f.refs) ? ae._f.refs[0] : ae._f.ref;
                            if (rs(Se)) {
                                const Ze = Se.closest("form");
                                if (Ze) {
                                    Ze.reset();
                                    break
                                }
                            }
                        }
                    }
                    if (j.keepFieldsRef) for (const P of m.mount) x(P, ie(ne, P)); else u = {}
                }
                if (i.shouldUnregister) {
                    if (f = j.keepDefaultValues ? pt(o) : {}, j.keepFieldsRef) for (const P of m.mount) Xe(f, P, ie(ne, P))
                } else f = pt(ne);
                R.array.next({values: {...ne}}), R.state.next({values: {...ne}})
            }
            m = {
                mount: j.keepDirtyValues ? m.mount : new Set,
                unMount: new Set,
                array: new Set,
                registerName: new Set,
                disabled: new Set,
                watch: new Set,
                watchAll: !1,
                focus: ""
            }, d.mount = !S.isValid || !!j.keepIsValid || !!j.keepDirtyValues || !i.shouldUnregister && !jt(ne), d.watch = !!i.shouldUnregister, d.keepIsValid = !!j.keepIsValid, d.action = !1, j.keepErrors || (r.errors = {}), R.state.next({
                submitCount: j.keepSubmitCount ? r.submitCount : 0,
                isDirty: ee ? !1 : j.keepDirty ? r.isDirty : j.keepValues ? ge() : !!(j.keepDefaultValues && !Gn(_, o)),
                isSubmitted: j.keepIsSubmitted ? r.isSubmitted : !1,
                dirtyFields: ee ? {} : j.keepDirtyValues ? j.keepDefaultValues && f ? di(o, f) : r.dirtyFields : j.keepDefaultValues && _ ? di(o, _) : j.keepDirty ? r.dirtyFields : {},
                touchedFields: j.keepTouched ? r.touchedFields : {},
                errors: j.keepErrors ? r.errors : {},
                isSubmitSuccessful: j.keepIsSubmitSuccessful ? r.isSubmitSuccessful : !1,
                isSubmitting: !1,
                defaultValues: o
            })
        }, Si = (_, j) => _i(Tn(_) ? _(f) : _, {...i.resetOptions, ...j}), Ts = (_, j = {}) => {
            const w = ie(u, _), X = w && w._f;
            if (X) {
                const ee = X.refs ? X.refs[0] : X.ref;
                ee.focus && setTimeout(() => {
                    ee.focus(), j.shouldSelect && Tn(ee.select) && ee.select()
                })
            }
        }, js = _ => {
            r = {...r, ..._}
        }, Sl = {
            control: {
                register: Fa,
                unregister: z,
                getFieldState: Re,
                handleSubmit: bl,
                setError: He,
                _subscribe: hn,
                _runSchema: Le,
                _updateIsValidating: J,
                _focusError: Xa,
                _getWatch: Z,
                _getDirty: ge,
                _setValid: U,
                _setFieldArray: W,
                _setDisabledField: st,
                _setErrors: te,
                _getFieldArray: K,
                _reset: _i,
                _resetDefaultValues: () => Tn(i.defaultValues) && i.defaultValues().then(_ => {
                    Si(_, i.resetOptions), R.state.next({isLoading: !1})
                }),
                _removeUnmounted: je,
                _disableForm: Os,
                _subjects: R,
                _proxyFormState: S,
                get _fields() {
                    return u
                },
                get _formValues() {
                    return f
                },
                get _state() {
                    return d
                },
                set _state(_) {
                    d = _
                },
                get _defaultValues() {
                    return o
                },
                get _names() {
                    return m
                },
                set _names(_) {
                    m = _
                },
                get _formState() {
                    return r
                },
                get _options() {
                    return i
                },
                set _options(_) {
                    i = {...i, ..._}
                }
            },
            subscribe: Ln,
            trigger: ye,
            register: Fa,
            handleSubmit: bl,
            watch: dn,
            setValue: x,
            setValues: k,
            getValues: _e,
            reset: Si,
            resetField: _l,
            resetDefaultValues: (_, j = {}) => {
                if (o = pt(_), !j.keepDirty) {
                    const w = di(o, f);
                    r.dirtyFields = w, r.isDirty = !jt(w)
                }
                j.keepIsValid || U(), R.state.next({...r, defaultValues: o})
            },
            clearErrors: lt,
            unregister: z,
            setError: He,
            setFocus: Ts,
            getFieldState: Re
        };
    return {...Sl, formControl: Sl}
}

function zn(n = {}) {
    const i = Zt.useRef(void 0), r = Zt.useRef(void 0), u = Zt.useRef(n.formControl), [o, f] = Zt.useState(() => ({
        ...pt(Kv),
        isLoading: Tn(n.defaultValues),
        errors: n.errors || {},
        disabled: n.disabled || !1,
        defaultValues: Tn(n.defaultValues) ? void 0 : n.defaultValues
    }));
    if (!i.current || n.formControl && u.current !== n.formControl) if (u.current = n.formControl, n.formControl) i.current = {
        ...n.formControl,
        formState: o
    }, n.defaultValues && !Tn(n.defaultValues) && n.formControl.reset(n.defaultValues, n.resetOptions); else {
        const {formControl: m, ...y} = Z1(n);
        i.current = {...y, formState: o}
    }
    const d = i.current.control;
    return d._options = n, S1(() => {
        const m = d._subscribe({
            formState: d._proxyFormState,
            callback: () => f({...d._formState, defaultValues: d._defaultValues}),
            reRenderRoot: !0
        });
        return f(y => ({...y, isReady: !0})), d._formState.isReady = !0, m
    }, [d]), Zt.useEffect(() => d._disableForm(n.disabled), [d, n.disabled]), Zt.useEffect(() => {
        n.mode && (d._options.mode = n.mode), n.reValidateMode && (d._options.reValidateMode = n.reValidateMode)
    }, [d, n.mode, n.reValidateMode]), Zt.useEffect(() => {
        n.errors && (d._setErrors(n.errors), d._focusError())
    }, [d, n.errors]), Zt.useEffect(() => {
        n.shouldUnregister && d._subjects.state.next({values: d._getWatch()})
    }, [d, n.shouldUnregister]), Zt.useEffect(() => {
        if (d._proxyFormState.isDirty) {
            const m = d._getDirty();
            m !== o.isDirty && d._subjects.state.next({isDirty: m})
        }
    }, [d, o.isDirty]), Zt.useEffect(() => {
        var m;
        n.values && !Gn(n.values, r.current) ? (d._reset(n.values, {keepFieldsRef: !0, ...d._options.resetOptions}), !((m = d._options.resetOptions) === null || m === void 0) && m.keepIsValid || d._setValid(), r.current = n.values, f(y => ({...y}))) : d._resetDefaultValues()
    }, [d, n.values]), Zt.useEffect(() => {
        d._state.mount || (d._setValid(), d._state.mount = !0), d._state.watch && (d._state.watch = !1, d._subjects.state.next({...d._formState})), d._removeUnmounted()
    }), i.current.formState = Zt.useMemo(() => _1(o, d), [d, o]), i.current
}

const Ry = (n, i, r) => {
    if (n && "reportValidity" in n) {
        const u = ie(r, i);
        n.setCustomValidity(u && u.message || ""), n.reportValidity()
    }
}, mf = (n, i) => {
    for (const r in i.fields) {
        const u = i.fields[r];
        u && u.ref && "reportValidity" in u.ref ? Ry(u.ref, r, n) : u && u.refs && u.refs.forEach(o => Ry(o, r, n))
    }
}, wy = (n, i) => {
    i.shouldUseNativeValidation && mf(n, i);
    const r = {};
    for (const u in n) {
        const o = ie(i.fields, u), f = Object.assign(n[u] || {}, {ref: o && o.ref});
        if (L1(i.names || Object.keys(n), u)) {
            const d = Object.assign({}, ie(r, u));
            Xe(d, "root", f), Xe(r, u, d)
        } else Xe(r, u, f)
    }
    return r
}, L1 = (n, i) => {
    const r = Ny(i).replace(/[.*+?^${}()|\\]/g, "\\$&");
    return n.some(u => Ny(u).match(`^${r}\\.\\d+`))
};

function Ny(n) {
    return n.replace(/[\[\]]/g, "")
}

var Cy;

function $(n, i, r) {
    function u(m, y) {
        if (m._zod || Object.defineProperty(m, "_zod", {
            value: {def: y, constr: d, traits: new Set},
            enumerable: !1
        }), m._zod.traits.has(n)) return;
        m._zod.traits.add(n), i(m, y);
        const v = d.prototype, b = Object.keys(v);
        for (let S = 0; S < b.length; S++) {
            const T = b[S];
            T in m || (m[T] = v[T].bind(m))
        }
    }

    const o = r?.Parent ?? Object;

    class f extends o {
    }

    Object.defineProperty(f, "name", {value: n});

    function d(m) {
        var y;
        const v = r?.Parent ? new f : this;
        u(v, m), (y = v._zod).deferred ?? (y.deferred = []);
        for (const b of v._zod.deferred) b();
        return v
    }

    return Object.defineProperty(d, "init", {value: u}), Object.defineProperty(d, Symbol.hasInstance, {value: m => r?.Parent && m instanceof r.Parent ? !0 : m?._zod?.traits?.has(n)}), Object.defineProperty(d, "name", {value: n}), d
}

class fl extends Error {
    constructor() {
        super("Encountered Promise during synchronous parse. Use .parseAsync() instead.")
    }
}

class Pv extends Error {
    constructor(i) {
        super(`Encountered unidirectional transform during encode: ${i}`), this.name = "ZodEncodeError"
    }
}

(Cy = globalThis).__zod_globalConfig ?? (Cy.__zod_globalConfig = {});
const Zf = globalThis.__zod_globalConfig;

function vi(n) {
    return Zf
}

function Iv(n) {
    const i = Object.values(n).filter(u => typeof u == "number");
    return Object.entries(n).filter(([u, o]) => i.indexOf(+u) === -1).map(([u, o]) => o)
}

function pf(n, i) {
    return typeof i == "bigint" ? i.toString() : i
}

function Lf(n) {
    return {
        get value() {
            {
                const i = n();
                return Object.defineProperty(this, "value", {value: i}), i
            }
        }
    }
}

function qf(n) {
    return n == null
}

function Bf(n) {
    const i = n.startsWith("^") ? 1 : 0, r = n.endsWith("$") ? n.length - 1 : n.length;
    return n.slice(i, r)
}

function q1(n, i) {
    const r = n / i, u = Math.round(r), o = Number.EPSILON * Math.max(Math.abs(r), 1);
    return Math.abs(r - u) < o ? 0 : r - u
}

const Dy = Symbol("evaluating");

function Je(n, i, r) {
    let u;
    Object.defineProperty(n, i, {
        get() {
            if (u !== Dy) return u === void 0 && (u = Dy, u = r()), u
        }, set(o) {
            Object.defineProperty(n, i, {value: o})
        }, configurable: !0
    })
}

function bi(n, i, r) {
    Object.defineProperty(n, i, {value: r, writable: !0, enumerable: !0, configurable: !0})
}

function Ya(...n) {
    const i = {};
    for (const r of n) {
        const u = Object.getOwnPropertyDescriptors(r);
        Object.assign(i, u)
    }
    return Object.defineProperties({}, i)
}

function My(n) {
    return JSON.stringify(n)
}

function B1(n) {
    return n.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "")
}

const Wv = "captureStackTrace" in Error ? Error.captureStackTrace : (...n) => {
};

function ss(n) {
    return typeof n == "object" && n !== null && !Array.isArray(n)
}

const k1 = Lf(() => {
    if (Zf.jitless || typeof navigator < "u" && navigator?.userAgent?.includes("Cloudflare")) return !1;
    try {
        const n = Function;
        return new n(""), !0
    } catch {
        return !1
    }
});

function zr(n) {
    if (ss(n) === !1) return !1;
    const i = n.constructor;
    if (i === void 0 || typeof i != "function") return !0;
    const r = i.prototype;
    return !(ss(r) === !1 || Object.prototype.hasOwnProperty.call(r, "isPrototypeOf") === !1)
}

function eg(n) {
    return zr(n) ? {...n} : Array.isArray(n) ? [...n] : n instanceof Map ? new Map(n) : n instanceof Set ? new Set(n) : n
}

const H1 = new Set(["string", "number", "symbol"]);

function dl(n) {
    return n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function Ga(n, i, r) {
    const u = new n._zod.constr(i ?? n._zod.def);
    return (!i || r?.parent) && (u._zod.parent = n), u
}

function me(n) {
    const i = n;
    if (!i) return {};
    if (typeof i == "string") return {error: () => i};
    if (i?.message !== void 0) {
        if (i?.error !== void 0) throw new Error("Cannot specify both `message` and `error` params");
        i.error = i.message
    }
    return delete i.message, typeof i.error == "string" ? {...i, error: () => i.error} : i
}

function V1(n) {
    return Object.keys(n).filter(i => n[i]._zod.optin === "optional" && n[i]._zod.optout === "optional")
}

const $1 = {
    safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
    int32: [-2147483648, 2147483647],
    uint32: [0, 4294967295],
    float32: [-34028234663852886e22, 34028234663852886e22],
    float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
};

function Q1(n, i) {
    const r = n._zod.def, u = r.checks;
    if (u && u.length > 0) throw new Error(".pick() cannot be used on object schemas containing refinements");
    const f = Ya(n._zod.def, {
        get shape() {
            const d = {};
            for (const m in i) {
                if (!(m in r.shape)) throw new Error(`Unrecognized key: "${m}"`);
                i[m] && (d[m] = r.shape[m])
            }
            return bi(this, "shape", d), d
        }, checks: []
    });
    return Ga(n, f)
}

function Y1(n, i) {
    const r = n._zod.def, u = r.checks;
    if (u && u.length > 0) throw new Error(".omit() cannot be used on object schemas containing refinements");
    const f = Ya(n._zod.def, {
        get shape() {
            const d = {...n._zod.def.shape};
            for (const m in i) {
                if (!(m in r.shape)) throw new Error(`Unrecognized key: "${m}"`);
                i[m] && delete d[m]
            }
            return bi(this, "shape", d), d
        }, checks: []
    });
    return Ga(n, f)
}

function G1(n, i) {
    if (!zr(i)) throw new Error("Invalid input to extend: expected a plain object");
    const r = n._zod.def.checks;
    if (r && r.length > 0) {
        const f = n._zod.def.shape;
        for (const d in i) if (Object.getOwnPropertyDescriptor(f, d) !== void 0) throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.")
    }
    const o = Ya(n._zod.def, {
        get shape() {
            const f = {...n._zod.def.shape, ...i};
            return bi(this, "shape", f), f
        }
    });
    return Ga(n, o)
}

function F1(n, i) {
    if (!zr(i)) throw new Error("Invalid input to safeExtend: expected a plain object");
    const r = Ya(n._zod.def, {
        get shape() {
            const u = {...n._zod.def.shape, ...i};
            return bi(this, "shape", u), u
        }
    });
    return Ga(n, r)
}

function X1(n, i) {
    if (n._zod.def.checks?.length) throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
    const r = Ya(n._zod.def, {
        get shape() {
            const u = {...n._zod.def.shape, ...i._zod.def.shape};
            return bi(this, "shape", u), u
        }, get catchall() {
            return i._zod.def.catchall
        }, checks: i._zod.def.checks ?? []
    });
    return Ga(n, r)
}

function J1(n, i, r) {
    const o = i._zod.def.checks;
    if (o && o.length > 0) throw new Error(".partial() cannot be used on object schemas containing refinements");
    const d = Ya(i._zod.def, {
        get shape() {
            const m = i._zod.def.shape, y = {...m};
            if (r) for (const v in r) {
                if (!(v in m)) throw new Error(`Unrecognized key: "${v}"`);
                r[v] && (y[v] = n ? new n({type: "optional", innerType: m[v]}) : m[v])
            } else for (const v in m) y[v] = n ? new n({type: "optional", innerType: m[v]}) : m[v];
            return bi(this, "shape", y), y
        }, checks: []
    });
    return Ga(i, d)
}

function K1(n, i, r) {
    const u = Ya(i._zod.def, {
        get shape() {
            const o = i._zod.def.shape, f = {...o};
            if (r) for (const d in r) {
                if (!(d in f)) throw new Error(`Unrecognized key: "${d}"`);
                r[d] && (f[d] = new n({type: "nonoptional", innerType: o[d]}))
            } else for (const d in o) f[d] = new n({type: "nonoptional", innerType: o[d]});
            return bi(this, "shape", f), f
        }
    });
    return Ga(i, u)
}

function cl(n, i = 0) {
    if (n.aborted === !0) return !0;
    for (let r = i; r < n.issues.length; r++) if (n.issues[r]?.continue !== !0) return !0;
    return !1
}

function P1(n, i = 0) {
    if (n.aborted === !0) return !0;
    for (let r = i; r < n.issues.length; r++) if (n.issues[r]?.continue === !1) return !0;
    return !1
}

function tg(n, i) {
    return i.map(r => {
        var u;
        return (u = r).path ?? (u.path = []), r.path.unshift(n), r
    })
}

function Ju(n) {
    return typeof n == "string" ? n : n?.message
}

function gi(n, i, r) {
    const u = n.message ? n.message : Ju(n.inst?._zod.def?.error?.(n)) ?? Ju(i?.error?.(n)) ?? Ju(r.customError?.(n)) ?? Ju(r.localeError?.(n)) ?? "Invalid input", {
        inst: o,
        continue: f,
        input: d,
        ...m
    } = n;
    return m.path ?? (m.path = []), m.message = u, i?.reportInput && (m.input = d), m
}

function kf(n) {
    return Array.isArray(n) ? "array" : typeof n == "string" ? "string" : "unknown"
}

function Or(...n) {
    const [i, r, u] = n;
    return typeof i == "string" ? {message: i, code: "custom", input: r, inst: u} : {...i}
}

const ng = (n, i) => {
    n.name = "$ZodError", Object.defineProperty(n, "_zod", {
        value: n._zod,
        enumerable: !1
    }), Object.defineProperty(n, "issues", {
        value: i,
        enumerable: !1
    }), n.message = JSON.stringify(i, pf, 2), Object.defineProperty(n, "toString", {
        value: () => n.message,
        enumerable: !1
    })
}, Hf = $("$ZodError", ng), gs = $("$ZodError", ng, {Parent: Error});

function I1(n, i = r => r.message) {
    const r = {}, u = [];
    for (const o of n.issues) o.path.length > 0 ? (r[o.path[0]] = r[o.path[0]] || [], r[o.path[0]].push(i(o))) : u.push(i(o));
    return {formErrors: u, fieldErrors: r}
}

function W1(n, i = r => r.message) {
    const r = {_errors: []}, u = (o, f = []) => {
        for (const d of o.issues) if (d.code === "invalid_union" && d.errors.length) d.errors.map(m => u({issues: m}, [...f, ...d.path])); else if (d.code === "invalid_key") u({issues: d.issues}, [...f, ...d.path]); else if (d.code === "invalid_element") u({issues: d.issues}, [...f, ...d.path]); else {
            const m = [...f, ...d.path];
            if (m.length === 0) r._errors.push(i(d)); else {
                let y = r, v = 0;
                for (; v < m.length;) {
                    const b = m[v];
                    v === m.length - 1 ? (y[b] = y[b] || {_errors: []}, y[b]._errors.push(i(d))) : y[b] = y[b] || {_errors: []}, y = y[b], v++
                }
            }
        }
    };
    return u(n), r
}

const bs = n => (i, r, u, o) => {
        const f = u ? {...u, async: !1} : {async: !1}, d = i._zod.run({value: r, issues: []}, f);
        if (d instanceof Promise) throw new fl;
        if (d.issues.length) {
            const m = new (o?.Err ?? n)(d.issues.map(y => gi(y, f, vi())));
            throw Wv(m, o?.callee), m
        }
        return d.value
    }, eE = bs(gs), _s = n => async (i, r, u, o) => {
        const f = u ? {...u, async: !0} : {async: !0};
        let d = i._zod.run({value: r, issues: []}, f);
        if (d instanceof Promise && (d = await d), d.issues.length) {
            const m = new (o?.Err ?? n)(d.issues.map(y => gi(y, f, vi())));
            throw Wv(m, o?.callee), m
        }
        return d.value
    }, tE = _s(gs), Ss = n => (i, r, u) => {
        const o = u ? {...u, async: !1} : {async: !1}, f = i._zod.run({value: r, issues: []}, o);
        if (f instanceof Promise) throw new fl;
        return f.issues.length ? {success: !1, error: new (n ?? Hf)(f.issues.map(d => gi(d, o, vi())))} : {
            success: !0,
            data: f.value
        }
    }, nE = Ss(gs), Es = n => async (i, r, u) => {
        const o = u ? {...u, async: !0} : {async: !0};
        let f = i._zod.run({value: r, issues: []}, o);
        return f instanceof Promise && (f = await f), f.issues.length ? {
            success: !1,
            error: new n(f.issues.map(d => gi(d, o, vi())))
        } : {success: !0, data: f.value}
    }, aE = Es(gs), iE = n => (i, r, u) => {
        const o = u ? {...u, direction: "backward"} : {direction: "backward"};
        return bs(n)(i, r, o)
    }, lE = n => (i, r, u) => bs(n)(i, r, u), rE = n => async (i, r, u) => {
        const o = u ? {...u, direction: "backward"} : {direction: "backward"};
        return _s(n)(i, r, o)
    }, uE = n => async (i, r, u) => _s(n)(i, r, u), sE = n => (i, r, u) => {
        const o = u ? {...u, direction: "backward"} : {direction: "backward"};
        return Ss(n)(i, r, o)
    }, oE = n => (i, r, u) => Ss(n)(i, r, u), cE = n => async (i, r, u) => {
        const o = u ? {...u, direction: "backward"} : {direction: "backward"};
        return Es(n)(i, r, o)
    }, fE = n => async (i, r, u) => Es(n)(i, r, u), dE = /^[cC][0-9a-z]{6,}$/, hE = /^[0-9a-z]+$/,
    mE = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/, pE = /^[0-9a-vA-V]{20}$/, yE = /^[A-Za-z0-9]{27}$/,
    vE = /^[a-zA-Z0-9_-]{21}$/,
    gE = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/,
    bE = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/,
    Uy = n => n ? new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${n}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`) : /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/,
    _E = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/,
    SE = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";

function EE() {
    return new RegExp(SE, "u")
}

const xE = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
    zE = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/,
    OE = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/,
    TE = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
    jE = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/, ag = /^[A-Za-z0-9_-]*$/,
    AE = /^https?$/, RE = /^\+[1-9]\d{6,14}$/,
    ig = "(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))",
    wE = new RegExp(`^${ig}$`);

function lg(n) {
    const i = "(?:[01]\\d|2[0-3]):[0-5]\\d";
    return typeof n.precision == "number" ? n.precision === -1 ? `${i}` : n.precision === 0 ? `${i}:[0-5]\\d` : `${i}:[0-5]\\d\\.\\d{${n.precision}}` : `${i}(?::[0-5]\\d(?:\\.\\d+)?)?`
}

function NE(n) {
    return new RegExp(`^${lg(n)}$`)
}

function CE(n) {
    const i = lg({precision: n.precision}), r = ["Z"];
    n.local && r.push(""), n.offset && r.push("([+-](?:[01]\\d|2[0-3]):[0-5]\\d)");
    const u = `${i}(?:${r.join("|")})`;
    return new RegExp(`^${ig}T(?:${u})$`)
}

const DE = n => {
        const i = n ? `[\\s\\S]{${n?.minimum ?? 0},${n?.maximum ?? ""}}` : "[\\s\\S]*";
        return new RegExp(`^${i}$`)
    }, ME = /^-?\d+$/, UE = /^-?\d+(?:\.\d+)?$/, ZE = /^(?:true|false)$/i, LE = /^[^A-Z]*$/, qE = /^[^a-z]*$/,
    It = $("$ZodCheck", (n, i) => {
        var r;
        n._zod ?? (n._zod = {}), n._zod.def = i, (r = n._zod).onattach ?? (r.onattach = [])
    }), rg = {number: "number", bigint: "bigint", object: "date"}, ug = $("$ZodCheckLessThan", (n, i) => {
        It.init(n, i);
        const r = rg[typeof i.value];
        n._zod.onattach.push(u => {
            const o = u._zod.bag, f = (i.inclusive ? o.maximum : o.exclusiveMaximum) ?? Number.POSITIVE_INFINITY;
            i.value < f && (i.inclusive ? o.maximum = i.value : o.exclusiveMaximum = i.value)
        }), n._zod.check = u => {
            (i.inclusive ? u.value <= i.value : u.value < i.value) || u.issues.push({
                origin: r,
                code: "too_big",
                maximum: typeof i.value == "object" ? i.value.getTime() : i.value,
                input: u.value,
                inclusive: i.inclusive,
                inst: n,
                continue: !i.abort
            })
        }
    }), sg = $("$ZodCheckGreaterThan", (n, i) => {
        It.init(n, i);
        const r = rg[typeof i.value];
        n._zod.onattach.push(u => {
            const o = u._zod.bag, f = (i.inclusive ? o.minimum : o.exclusiveMinimum) ?? Number.NEGATIVE_INFINITY;
            i.value > f && (i.inclusive ? o.minimum = i.value : o.exclusiveMinimum = i.value)
        }), n._zod.check = u => {
            (i.inclusive ? u.value >= i.value : u.value > i.value) || u.issues.push({
                origin: r,
                code: "too_small",
                minimum: typeof i.value == "object" ? i.value.getTime() : i.value,
                input: u.value,
                inclusive: i.inclusive,
                inst: n,
                continue: !i.abort
            })
        }
    }), BE = $("$ZodCheckMultipleOf", (n, i) => {
        It.init(n, i), n._zod.onattach.push(r => {
            var u;
            (u = r._zod.bag).multipleOf ?? (u.multipleOf = i.value)
        }), n._zod.check = r => {
            if (typeof r.value != typeof i.value) throw new Error("Cannot mix number and bigint in multiple_of check.");
            (typeof r.value == "bigint" ? r.value % i.value === BigInt(0) : q1(r.value, i.value) === 0) || r.issues.push({
                origin: typeof r.value,
                code: "not_multiple_of",
                divisor: i.value,
                input: r.value,
                inst: n,
                continue: !i.abort
            })
        }
    }), kE = $("$ZodCheckNumberFormat", (n, i) => {
        It.init(n, i), i.format = i.format || "float64";
        const r = i.format?.includes("int"), u = r ? "int" : "number", [o, f] = $1[i.format];
        n._zod.onattach.push(d => {
            const m = d._zod.bag;
            m.format = i.format, m.minimum = o, m.maximum = f, r && (m.pattern = ME)
        }), n._zod.check = d => {
            const m = d.value;
            if (r) {
                if (!Number.isInteger(m)) {
                    d.issues.push({expected: u, format: i.format, code: "invalid_type", continue: !1, input: m, inst: n});
                    return
                }
                if (!Number.isSafeInteger(m)) {
                    m > 0 ? d.issues.push({
                        input: m,
                        code: "too_big",
                        maximum: Number.MAX_SAFE_INTEGER,
                        note: "Integers must be within the safe integer range.",
                        inst: n,
                        origin: u,
                        inclusive: !0,
                        continue: !i.abort
                    }) : d.issues.push({
                        input: m,
                        code: "too_small",
                        minimum: Number.MIN_SAFE_INTEGER,
                        note: "Integers must be within the safe integer range.",
                        inst: n,
                        origin: u,
                        inclusive: !0,
                        continue: !i.abort
                    });
                    return
                }
            }
            m < o && d.issues.push({
                origin: "number",
                input: m,
                code: "too_small",
                minimum: o,
                inclusive: !0,
                inst: n,
                continue: !i.abort
            }), m > f && d.issues.push({
                origin: "number",
                input: m,
                code: "too_big",
                maximum: f,
                inclusive: !0,
                inst: n,
                continue: !i.abort
            })
        }
    }), HE = $("$ZodCheckMaxLength", (n, i) => {
        var r;
        It.init(n, i), (r = n._zod.def).when ?? (r.when = u => {
            const o = u.value;
            return !qf(o) && o.length !== void 0
        }), n._zod.onattach.push(u => {
            const o = u._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
            i.maximum < o && (u._zod.bag.maximum = i.maximum)
        }), n._zod.check = u => {
            const o = u.value;
            if (o.length <= i.maximum) return;
            const d = kf(o);
            u.issues.push({
                origin: d,
                code: "too_big",
                maximum: i.maximum,
                inclusive: !0,
                input: o,
                inst: n,
                continue: !i.abort
            })
        }
    }), VE = $("$ZodCheckMinLength", (n, i) => {
        var r;
        It.init(n, i), (r = n._zod.def).when ?? (r.when = u => {
            const o = u.value;
            return !qf(o) && o.length !== void 0
        }), n._zod.onattach.push(u => {
            const o = u._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
            i.minimum > o && (u._zod.bag.minimum = i.minimum)
        }), n._zod.check = u => {
            const o = u.value;
            if (o.length >= i.minimum) return;
            const d = kf(o);
            u.issues.push({
                origin: d,
                code: "too_small",
                minimum: i.minimum,
                inclusive: !0,
                input: o,
                inst: n,
                continue: !i.abort
            })
        }
    }), $E = $("$ZodCheckLengthEquals", (n, i) => {
        var r;
        It.init(n, i), (r = n._zod.def).when ?? (r.when = u => {
            const o = u.value;
            return !qf(o) && o.length !== void 0
        }), n._zod.onattach.push(u => {
            const o = u._zod.bag;
            o.minimum = i.length, o.maximum = i.length, o.length = i.length
        }), n._zod.check = u => {
            const o = u.value, f = o.length;
            if (f === i.length) return;
            const d = kf(o), m = f > i.length;
            u.issues.push({
                origin: d, ...m ? {code: "too_big", maximum: i.length} : {code: "too_small", minimum: i.length},
                inclusive: !0,
                exact: !0,
                input: u.value,
                inst: n,
                continue: !i.abort
            })
        }
    }), xs = $("$ZodCheckStringFormat", (n, i) => {
        var r, u;
        It.init(n, i), n._zod.onattach.push(o => {
            const f = o._zod.bag;
            f.format = i.format, i.pattern && (f.patterns ?? (f.patterns = new Set), f.patterns.add(i.pattern))
        }), i.pattern ? (r = n._zod).check ?? (r.check = o => {
            i.pattern.lastIndex = 0, !i.pattern.test(o.value) && o.issues.push({
                origin: "string",
                code: "invalid_format",
                format: i.format,
                input: o.value, ...i.pattern ? {pattern: i.pattern.toString()} : {},
                inst: n,
                continue: !i.abort
            })
        }) : (u = n._zod).check ?? (u.check = () => {
        })
    }), QE = $("$ZodCheckRegex", (n, i) => {
        xs.init(n, i), n._zod.check = r => {
            i.pattern.lastIndex = 0, !i.pattern.test(r.value) && r.issues.push({
                origin: "string",
                code: "invalid_format",
                format: "regex",
                input: r.value,
                pattern: i.pattern.toString(),
                inst: n,
                continue: !i.abort
            })
        }
    }), YE = $("$ZodCheckLowerCase", (n, i) => {
        i.pattern ?? (i.pattern = LE), xs.init(n, i)
    }), GE = $("$ZodCheckUpperCase", (n, i) => {
        i.pattern ?? (i.pattern = qE), xs.init(n, i)
    }), FE = $("$ZodCheckIncludes", (n, i) => {
        It.init(n, i);
        const r = dl(i.includes), u = new RegExp(typeof i.position == "number" ? `^.{${i.position}}${r}` : r);
        i.pattern = u, n._zod.onattach.push(o => {
            const f = o._zod.bag;
            f.patterns ?? (f.patterns = new Set), f.patterns.add(u)
        }), n._zod.check = o => {
            o.value.includes(i.includes, i.position) || o.issues.push({
                origin: "string",
                code: "invalid_format",
                format: "includes",
                includes: i.includes,
                input: o.value,
                inst: n,
                continue: !i.abort
            })
        }
    }), XE = $("$ZodCheckStartsWith", (n, i) => {
        It.init(n, i);
        const r = new RegExp(`^${dl(i.prefix)}.*`);
        i.pattern ?? (i.pattern = r), n._zod.onattach.push(u => {
            const o = u._zod.bag;
            o.patterns ?? (o.patterns = new Set), o.patterns.add(r)
        }), n._zod.check = u => {
            u.value.startsWith(i.prefix) || u.issues.push({
                origin: "string",
                code: "invalid_format",
                format: "starts_with",
                prefix: i.prefix,
                input: u.value,
                inst: n,
                continue: !i.abort
            })
        }
    }), JE = $("$ZodCheckEndsWith", (n, i) => {
        It.init(n, i);
        const r = new RegExp(`.*${dl(i.suffix)}$`);
        i.pattern ?? (i.pattern = r), n._zod.onattach.push(u => {
            const o = u._zod.bag;
            o.patterns ?? (o.patterns = new Set), o.patterns.add(r)
        }), n._zod.check = u => {
            u.value.endsWith(i.suffix) || u.issues.push({
                origin: "string",
                code: "invalid_format",
                format: "ends_with",
                suffix: i.suffix,
                input: u.value,
                inst: n,
                continue: !i.abort
            })
        }
    }), KE = $("$ZodCheckOverwrite", (n, i) => {
        It.init(n, i), n._zod.check = r => {
            r.value = i.tx(r.value)
        }
    });

class PE {
    constructor(i = []) {
        this.content = [], this.indent = 0, this && (this.args = i)
    }

    indented(i) {
        this.indent += 1, i(this), this.indent -= 1
    }

    write(i) {
        if (typeof i == "function") {
            i(this, {execution: "sync"}), i(this, {execution: "async"});
            return
        }
        const u = i.split(`
`).filter(d => d), o = Math.min(...u.map(d => d.length - d.trimStart().length)),
            f = u.map(d => d.slice(o)).map(d => " ".repeat(this.indent * 2) + d);
        for (const d of f) this.content.push(d)
    }

    compile() {
        const i = Function, r = this?.args, o = [...(this?.content ?? [""]).map(f => `  ${f}`)];
        return new i(...r, o.join(`
`))
    }
}

const IE = {major: 4, minor: 4, patch: 3}, ft = $("$ZodType", (n, i) => {
    var r;
    n ?? (n = {}), n._zod.def = i, n._zod.bag = n._zod.bag || {}, n._zod.version = IE;
    const u = [...n._zod.def.checks ?? []];
    n._zod.traits.has("$ZodCheck") && u.unshift(n);
    for (const o of u) for (const f of o._zod.onattach) f(n);
    if (u.length === 0) (r = n._zod).deferred ?? (r.deferred = []), n._zod.deferred?.push(() => {
        n._zod.run = n._zod.parse
    }); else {
        const o = (d, m, y) => {
            let v = cl(d), b;
            for (const S of m) {
                if (S._zod.def.when) {
                    if (P1(d) || !S._zod.def.when(d)) continue
                } else if (v) continue;
                const T = d.issues.length, R = S._zod.check(d);
                if (R instanceof Promise && y?.async === !1) throw new fl;
                if (b || R instanceof Promise) b = (b ?? Promise.resolve()).then(async () => {
                    await R, d.issues.length !== T && (v || (v = cl(d, T)))
                }); else {
                    if (d.issues.length === T) continue;
                    v || (v = cl(d, T))
                }
            }
            return b ? b.then(() => d) : d
        }, f = (d, m, y) => {
            if (cl(d)) return d.aborted = !0, d;
            const v = o(m, u, y);
            if (v instanceof Promise) {
                if (y.async === !1) throw new fl;
                return v.then(b => n._zod.parse(b, y))
            }
            return n._zod.parse(v, y)
        };
        n._zod.run = (d, m) => {
            if (m.skipChecks) return n._zod.parse(d, m);
            if (m.direction === "backward") {
                const v = n._zod.parse({value: d.value, issues: []}, {...m, skipChecks: !0});
                return v instanceof Promise ? v.then(b => f(b, d, m)) : f(v, d, m)
            }
            const y = n._zod.parse(d, m);
            if (y instanceof Promise) {
                if (m.async === !1) throw new fl;
                return y.then(v => o(v, u, m))
            }
            return o(y, u, m)
        }
    }
    Je(n, "~standard", () => ({
        validate: o => {
            try {
                const f = nE(n, o);
                return f.success ? {value: f.data} : {issues: f.error?.issues}
            } catch {
                return aE(n, o).then(d => d.success ? {value: d.data} : {issues: d.error?.issues})
            }
        }, vendor: "zod", version: 1
    }))
}), Vf = $("$ZodString", (n, i) => {
    ft.init(n, i), n._zod.pattern = [...n?._zod.bag?.patterns ?? []].pop() ?? DE(n._zod.bag), n._zod.parse = (r, u) => {
        if (i.coerce) try {
            r.value = String(r.value)
        } catch {
        }
        return typeof r.value == "string" || r.issues.push({
            expected: "string",
            code: "invalid_type",
            input: r.value,
            inst: n
        }), r
    }
}), it = $("$ZodStringFormat", (n, i) => {
    xs.init(n, i), Vf.init(n, i)
}), WE = $("$ZodGUID", (n, i) => {
    i.pattern ?? (i.pattern = bE), it.init(n, i)
}), ex = $("$ZodUUID", (n, i) => {
    if (i.version) {
        const u = {v1: 1, v2: 2, v3: 3, v4: 4, v5: 5, v6: 6, v7: 7, v8: 8}[i.version];
        if (u === void 0) throw new Error(`Invalid UUID version: "${i.version}"`);
        i.pattern ?? (i.pattern = Uy(u))
    } else i.pattern ?? (i.pattern = Uy());
    it.init(n, i)
}), tx = $("$ZodEmail", (n, i) => {
    i.pattern ?? (i.pattern = _E), it.init(n, i)
}), nx = $("$ZodURL", (n, i) => {
    it.init(n, i), n._zod.check = r => {
        try {
            const u = r.value.trim();
            if (!i.normalize && i.protocol?.source === AE.source && !/^https?:\/\//i.test(u)) {
                r.issues.push({
                    code: "invalid_format",
                    format: "url",
                    note: "Invalid URL format",
                    input: r.value,
                    inst: n,
                    continue: !i.abort
                });
                return
            }
            const o = new URL(u);
            i.hostname && (i.hostname.lastIndex = 0, i.hostname.test(o.hostname) || r.issues.push({
                code: "invalid_format",
                format: "url",
                note: "Invalid hostname",
                pattern: i.hostname.source,
                input: r.value,
                inst: n,
                continue: !i.abort
            })), i.protocol && (i.protocol.lastIndex = 0, i.protocol.test(o.protocol.endsWith(":") ? o.protocol.slice(0, -1) : o.protocol) || r.issues.push({
                code: "invalid_format",
                format: "url",
                note: "Invalid protocol",
                pattern: i.protocol.source,
                input: r.value,
                inst: n,
                continue: !i.abort
            })), i.normalize ? r.value = o.href : r.value = u;
            return
        } catch {
            r.issues.push({code: "invalid_format", format: "url", input: r.value, inst: n, continue: !i.abort})
        }
    }
}), ax = $("$ZodEmoji", (n, i) => {
    i.pattern ?? (i.pattern = EE()), it.init(n, i)
}), ix = $("$ZodNanoID", (n, i) => {
    i.pattern ?? (i.pattern = vE), it.init(n, i)
}), lx = $("$ZodCUID", (n, i) => {
    i.pattern ?? (i.pattern = dE), it.init(n, i)
}), rx = $("$ZodCUID2", (n, i) => {
    i.pattern ?? (i.pattern = hE), it.init(n, i)
}), ux = $("$ZodULID", (n, i) => {
    i.pattern ?? (i.pattern = mE), it.init(n, i)
}), sx = $("$ZodXID", (n, i) => {
    i.pattern ?? (i.pattern = pE), it.init(n, i)
}), ox = $("$ZodKSUID", (n, i) => {
    i.pattern ?? (i.pattern = yE), it.init(n, i)
}), cx = $("$ZodISODateTime", (n, i) => {
    i.pattern ?? (i.pattern = CE(i)), it.init(n, i)
}), fx = $("$ZodISODate", (n, i) => {
    i.pattern ?? (i.pattern = wE), it.init(n, i)
}), dx = $("$ZodISOTime", (n, i) => {
    i.pattern ?? (i.pattern = NE(i)), it.init(n, i)
}), hx = $("$ZodISODuration", (n, i) => {
    i.pattern ?? (i.pattern = gE), it.init(n, i)
}), mx = $("$ZodIPv4", (n, i) => {
    i.pattern ?? (i.pattern = xE), it.init(n, i), n._zod.bag.format = "ipv4"
}), px = $("$ZodIPv6", (n, i) => {
    i.pattern ?? (i.pattern = zE), it.init(n, i), n._zod.bag.format = "ipv6", n._zod.check = r => {
        try {
            new URL(`http://[${r.value}]`)
        } catch {
            r.issues.push({code: "invalid_format", format: "ipv6", input: r.value, inst: n, continue: !i.abort})
        }
    }
}), yx = $("$ZodCIDRv4", (n, i) => {
    i.pattern ?? (i.pattern = OE), it.init(n, i)
}), vx = $("$ZodCIDRv6", (n, i) => {
    i.pattern ?? (i.pattern = TE), it.init(n, i), n._zod.check = r => {
        const u = r.value.split("/");
        try {
            if (u.length !== 2) throw new Error;
            const [o, f] = u;
            if (!f) throw new Error;
            const d = Number(f);
            if (`${d}` !== f) throw new Error;
            if (d < 0 || d > 128) throw new Error;
            new URL(`http://[${o}]`)
        } catch {
            r.issues.push({code: "invalid_format", format: "cidrv6", input: r.value, inst: n, continue: !i.abort})
        }
    }
});

function og(n) {
    if (n === "") return !0;
    if (/\s/.test(n) || n.length % 4 !== 0) return !1;
    try {
        return atob(n), !0
    } catch {
        return !1
    }
}

const gx = $("$ZodBase64", (n, i) => {
    i.pattern ?? (i.pattern = jE), it.init(n, i), n._zod.bag.contentEncoding = "base64", n._zod.check = r => {
        og(r.value) || r.issues.push({
            code: "invalid_format",
            format: "base64",
            input: r.value,
            inst: n,
            continue: !i.abort
        })
    }
});

function bx(n) {
    if (!ag.test(n)) return !1;
    const i = n.replace(/[-_]/g, u => u === "-" ? "+" : "/"), r = i.padEnd(Math.ceil(i.length / 4) * 4, "=");
    return og(r)
}

const _x = $("$ZodBase64URL", (n, i) => {
    i.pattern ?? (i.pattern = ag), it.init(n, i), n._zod.bag.contentEncoding = "base64url", n._zod.check = r => {
        bx(r.value) || r.issues.push({
            code: "invalid_format",
            format: "base64url",
            input: r.value,
            inst: n,
            continue: !i.abort
        })
    }
}), Sx = $("$ZodE164", (n, i) => {
    i.pattern ?? (i.pattern = RE), it.init(n, i)
});

function Ex(n, i = null) {
    try {
        const r = n.split(".");
        if (r.length !== 3) return !1;
        const [u] = r;
        if (!u) return !1;
        const o = JSON.parse(atob(u));
        return !("typ" in o && o?.typ !== "JWT" || !o.alg || i && (!("alg" in o) || o.alg !== i))
    } catch {
        return !1
    }
}

const xx = $("$ZodJWT", (n, i) => {
    it.init(n, i), n._zod.check = r => {
        Ex(r.value, i.alg) || r.issues.push({
            code: "invalid_format",
            format: "jwt",
            input: r.value,
            inst: n,
            continue: !i.abort
        })
    }
}), cg = $("$ZodNumber", (n, i) => {
    ft.init(n, i), n._zod.pattern = n._zod.bag.pattern ?? UE, n._zod.parse = (r, u) => {
        if (i.coerce) try {
            r.value = Number(r.value)
        } catch {
        }
        const o = r.value;
        if (typeof o == "number" && !Number.isNaN(o) && Number.isFinite(o)) return r;
        const f = typeof o == "number" ? Number.isNaN(o) ? "NaN" : Number.isFinite(o) ? void 0 : "Infinity" : void 0;
        return r.issues.push({
            expected: "number",
            code: "invalid_type",
            input: o,
            inst: n, ...f ? {received: f} : {}
        }), r
    }
}), zx = $("$ZodNumberFormat", (n, i) => {
    kE.init(n, i), cg.init(n, i)
}), Ox = $("$ZodBoolean", (n, i) => {
    ft.init(n, i), n._zod.pattern = ZE, n._zod.parse = (r, u) => {
        if (i.coerce) try {
            r.value = !!r.value
        } catch {
        }
        const o = r.value;
        return typeof o == "boolean" || r.issues.push({expected: "boolean", code: "invalid_type", input: o, inst: n}), r
    }
}), Tx = $("$ZodUnknown", (n, i) => {
    ft.init(n, i), n._zod.parse = r => r
}), jx = $("$ZodNever", (n, i) => {
    ft.init(n, i), n._zod.parse = (r, u) => (r.issues.push({
        expected: "never",
        code: "invalid_type",
        input: r.value,
        inst: n
    }), r)
});

function Zy(n, i, r) {
    n.issues.length && i.issues.push(...tg(r, n.issues)), i.value[r] = n.value
}

const Ax = $("$ZodArray", (n, i) => {
    ft.init(n, i), n._zod.parse = (r, u) => {
        const o = r.value;
        if (!Array.isArray(o)) return r.issues.push({expected: "array", code: "invalid_type", input: o, inst: n}), r;
        r.value = Array(o.length);
        const f = [];
        for (let d = 0; d < o.length; d++) {
            const m = o[d], y = i.element._zod.run({value: m, issues: []}, u);
            y instanceof Promise ? f.push(y.then(v => Zy(v, r, d))) : Zy(y, r, d)
        }
        return f.length ? Promise.all(f).then(() => r) : r
    }
});

function os(n, i, r, u, o, f) {
    const d = r in u;
    if (n.issues.length) {
        if (o && f && !d) return;
        i.issues.push(...tg(r, n.issues))
    }
    if (!d && !o) {
        n.issues.length || i.issues.push({code: "invalid_type", expected: "nonoptional", input: void 0, path: [r]});
        return
    }
    n.value === void 0 ? d && (i.value[r] = void 0) : i.value[r] = n.value
}

function fg(n) {
    const i = Object.keys(n.shape);
    for (const u of i) if (!n.shape?.[u]?._zod?.traits?.has("$ZodType")) throw new Error(`Invalid element at key "${u}": expected a Zod schema`);
    const r = V1(n.shape);
    return {...n, keys: i, keySet: new Set(i), numKeys: i.length, optionalKeys: new Set(r)}
}

function dg(n, i, r, u, o, f) {
    const d = [], m = o.keySet, y = o.catchall._zod, v = y.def.type, b = y.optin === "optional",
        S = y.optout === "optional";
    for (const T in i) {
        if (T === "__proto__" || m.has(T)) continue;
        if (v === "never") {
            d.push(T);
            continue
        }
        const R = y.run({value: i[T], issues: []}, u);
        R instanceof Promise ? n.push(R.then(q => os(q, r, T, i, b, S))) : os(R, r, T, i, b, S)
    }
    return d.length && r.issues.push({
        code: "unrecognized_keys",
        keys: d,
        input: i,
        inst: f
    }), n.length ? Promise.all(n).then(() => r) : r
}

const Rx = $("$ZodObject", (n, i) => {
    if (ft.init(n, i), !Object.getOwnPropertyDescriptor(i, "shape")?.get) {
        const m = i.shape;
        Object.defineProperty(i, "shape", {
            get: () => {
                const y = {...m};
                return Object.defineProperty(i, "shape", {value: y}), y
            }
        })
    }
    const u = Lf(() => fg(i));
    Je(n._zod, "propValues", () => {
        const m = i.shape, y = {};
        for (const v in m) {
            const b = m[v]._zod;
            if (b.values) {
                y[v] ?? (y[v] = new Set);
                for (const S of b.values) y[v].add(S)
            }
        }
        return y
    });
    const o = ss, f = i.catchall;
    let d;
    n._zod.parse = (m, y) => {
        d ?? (d = u.value);
        const v = m.value;
        if (!o(v)) return m.issues.push({expected: "object", code: "invalid_type", input: v, inst: n}), m;
        m.value = {};
        const b = [], S = d.shape;
        for (const T of d.keys) {
            const R = S[T], q = R._zod.optin === "optional", V = R._zod.optout === "optional",
                U = R._zod.run({value: v[T], issues: []}, y);
            U instanceof Promise ? b.push(U.then(J => os(J, m, T, v, q, V))) : os(U, m, T, v, q, V)
        }
        return f ? dg(b, v, m, y, u.value, n) : b.length ? Promise.all(b).then(() => m) : m
    }
}), wx = $("$ZodObjectJIT", (n, i) => {
    Rx.init(n, i);
    const r = n._zod.parse, u = Lf(() => fg(i)), o = T => {
        const R = new PE(["shape", "payload", "ctx"]), q = u.value, V = W => {
            const Y = My(W);
            return `shape[${Y}]._zod.run({ value: input[${Y}], issues: [] }, ctx)`
        };
        R.write("const input = payload.value;");
        const U = Object.create(null);
        let J = 0;
        for (const W of q.keys) U[W] = `key_${J++}`;
        R.write("const newResult = {};");
        for (const W of q.keys) {
            const Y = U[W], te = My(W), Te = T[W], le = Te?._zod?.optin === "optional",
                be = Te?._zod?.optout === "optional";
            R.write(`const ${Y} = ${V(W)};`), le && be ? R.write(`
        if (${Y}.issues.length) {
          if (${te} in input) {
            payload.issues = payload.issues.concat(${Y}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${te}, ...iss.path] : [${te}]
            })));
          }
        }
        
        if (${Y}.value === undefined) {
          if (${te} in input) {
            newResult[${te}] = undefined;
          }
        } else {
          newResult[${te}] = ${Y}.value;
        }
        
      `) : le ? R.write(`
        if (${Y}.issues.length) {
          payload.issues = payload.issues.concat(${Y}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${te}, ...iss.path] : [${te}]
          })));
        }
        
        if (${Y}.value === undefined) {
          if (${te} in input) {
            newResult[${te}] = undefined;
          }
        } else {
          newResult[${te}] = ${Y}.value;
        }
        
      `) : R.write(`
        const ${Y}_present = ${te} in input;
        if (${Y}.issues.length) {
          payload.issues = payload.issues.concat(${Y}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${te}, ...iss.path] : [${te}]
          })));
        }
        if (!${Y}_present && !${Y}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${te}]
          });
        }

        if (${Y}_present) {
          if (${Y}.value === undefined) {
            newResult[${te}] = undefined;
          } else {
            newResult[${te}] = ${Y}.value;
          }
        }

      `)
        }
        R.write("payload.value = newResult;"), R.write("return payload;");
        const G = R.compile();
        return (W, Y) => G(T, W, Y)
    };
    let f;
    const d = ss, m = !Zf.jitless, v = m && k1.value, b = i.catchall;
    let S;
    n._zod.parse = (T, R) => {
        S ?? (S = u.value);
        const q = T.value;
        return d(q) ? m && v && R?.async === !1 && R.jitless !== !0 ? (f || (f = o(i.shape)), T = f(T, R), b ? dg([], q, T, R, S, n) : T) : r(T, R) : (T.issues.push({
            expected: "object",
            code: "invalid_type",
            input: q,
            inst: n
        }), T)
    }
});

function Ly(n, i, r, u) {
    for (const f of n) if (f.issues.length === 0) return i.value = f.value, i;
    const o = n.filter(f => !cl(f));
    return o.length === 1 ? (i.value = o[0].value, o[0]) : (i.issues.push({
        code: "invalid_union",
        input: i.value,
        inst: r,
        errors: n.map(f => f.issues.map(d => gi(d, u, vi())))
    }), i)
}

const Nx = $("$ZodUnion", (n, i) => {
    ft.init(n, i), Je(n._zod, "optin", () => i.options.some(u => u._zod.optin === "optional") ? "optional" : void 0), Je(n._zod, "optout", () => i.options.some(u => u._zod.optout === "optional") ? "optional" : void 0), Je(n._zod, "values", () => {
        if (i.options.every(u => u._zod.values)) return new Set(i.options.flatMap(u => Array.from(u._zod.values)))
    }), Je(n._zod, "pattern", () => {
        if (i.options.every(u => u._zod.pattern)) {
            const u = i.options.map(o => o._zod.pattern);
            return new RegExp(`^(${u.map(o => Bf(o.source)).join("|")})$`)
        }
    });
    const r = i.options.length === 1 ? i.options[0]._zod.run : null;
    n._zod.parse = (u, o) => {
        if (r) return r(u, o);
        let f = !1;
        const d = [];
        for (const m of i.options) {
            const y = m._zod.run({value: u.value, issues: []}, o);
            if (y instanceof Promise) d.push(y), f = !0; else {
                if (y.issues.length === 0) return y;
                d.push(y)
            }
        }
        return f ? Promise.all(d).then(m => Ly(m, u, n, o)) : Ly(d, u, n, o)
    }
}), Cx = $("$ZodIntersection", (n, i) => {
    ft.init(n, i), n._zod.parse = (r, u) => {
        const o = r.value, f = i.left._zod.run({value: o, issues: []}, u),
            d = i.right._zod.run({value: o, issues: []}, u);
        return f instanceof Promise || d instanceof Promise ? Promise.all([f, d]).then(([y, v]) => qy(r, y, v)) : qy(r, f, d)
    }
});

function yf(n, i) {
    if (n === i) return {valid: !0, data: n};
    if (n instanceof Date && i instanceof Date && +n == +i) return {valid: !0, data: n};
    if (zr(n) && zr(i)) {
        const r = Object.keys(i), u = Object.keys(n).filter(f => r.indexOf(f) !== -1), o = {...n, ...i};
        for (const f of u) {
            const d = yf(n[f], i[f]);
            if (!d.valid) return {valid: !1, mergeErrorPath: [f, ...d.mergeErrorPath]};
            o[f] = d.data
        }
        return {valid: !0, data: o}
    }
    if (Array.isArray(n) && Array.isArray(i)) {
        if (n.length !== i.length) return {valid: !1, mergeErrorPath: []};
        const r = [];
        for (let u = 0; u < n.length; u++) {
            const o = n[u], f = i[u], d = yf(o, f);
            if (!d.valid) return {valid: !1, mergeErrorPath: [u, ...d.mergeErrorPath]};
            r.push(d.data)
        }
        return {valid: !0, data: r}
    }
    return {valid: !1, mergeErrorPath: []}
}

function qy(n, i, r) {
    const u = new Map;
    let o;
    for (const m of i.issues) if (m.code === "unrecognized_keys") {
        o ?? (o = m);
        for (const y of m.keys) u.has(y) || u.set(y, {}), u.get(y).l = !0
    } else n.issues.push(m);
    for (const m of r.issues) if (m.code === "unrecognized_keys") for (const y of m.keys) u.has(y) || u.set(y, {}), u.get(y).r = !0; else n.issues.push(m);
    const f = [...u].filter(([, m]) => m.l && m.r).map(([m]) => m);
    if (f.length && o && n.issues.push({...o, keys: f}), cl(n)) return n;
    const d = yf(i.value, r.value);
    if (!d.valid) throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(d.mergeErrorPath)}`);
    return n.value = d.data, n
}

const Dx = $("$ZodEnum", (n, i) => {
    ft.init(n, i);
    const r = Iv(i.entries), u = new Set(r);
    n._zod.values = u, n._zod.pattern = new RegExp(`^(${r.filter(o => H1.has(typeof o)).map(o => typeof o == "string" ? dl(o) : o.toString()).join("|")})$`), n._zod.parse = (o, f) => {
        const d = o.value;
        return u.has(d) || o.issues.push({code: "invalid_value", values: r, input: d, inst: n}), o
    }
}), Mx = $("$ZodLiteral", (n, i) => {
    if (ft.init(n, i), i.values.length === 0) throw new Error("Cannot create literal schema with no valid values");
    const r = new Set(i.values);
    n._zod.values = r, n._zod.pattern = new RegExp(`^(${i.values.map(u => typeof u == "string" ? dl(u) : u ? dl(u.toString()) : String(u)).join("|")})$`), n._zod.parse = (u, o) => {
        const f = u.value;
        return r.has(f) || u.issues.push({code: "invalid_value", values: i.values, input: f, inst: n}), u
    }
}), Ux = $("$ZodTransform", (n, i) => {
    ft.init(n, i), n._zod.optin = "optional", n._zod.parse = (r, u) => {
        if (u.direction === "backward") throw new Pv(n.constructor.name);
        const o = i.transform(r.value, r);
        if (u.async) return (o instanceof Promise ? o : Promise.resolve(o)).then(d => (r.value = d, r.fallback = !0, r));
        if (o instanceof Promise) throw new fl;
        return r.value = o, r.fallback = !0, r
    }
});

function By(n, i) {
    return i === void 0 && (n.issues.length || n.fallback) ? {issues: [], value: void 0} : n
}

const hg = $("$ZodOptional", (n, i) => {
    ft.init(n, i), n._zod.optin = "optional", n._zod.optout = "optional", Je(n._zod, "values", () => i.innerType._zod.values ? new Set([...i.innerType._zod.values, void 0]) : void 0), Je(n._zod, "pattern", () => {
        const r = i.innerType._zod.pattern;
        return r ? new RegExp(`^(${Bf(r.source)})?$`) : void 0
    }), n._zod.parse = (r, u) => {
        if (i.innerType._zod.optin === "optional") {
            const o = r.value, f = i.innerType._zod.run(r, u);
            return f instanceof Promise ? f.then(d => By(d, o)) : By(f, o)
        }
        return r.value === void 0 ? r : i.innerType._zod.run(r, u)
    }
}), Zx = $("$ZodExactOptional", (n, i) => {
    hg.init(n, i), Je(n._zod, "values", () => i.innerType._zod.values), Je(n._zod, "pattern", () => i.innerType._zod.pattern), n._zod.parse = (r, u) => i.innerType._zod.run(r, u)
}), Lx = $("$ZodNullable", (n, i) => {
    ft.init(n, i), Je(n._zod, "optin", () => i.innerType._zod.optin), Je(n._zod, "optout", () => i.innerType._zod.optout), Je(n._zod, "pattern", () => {
        const r = i.innerType._zod.pattern;
        return r ? new RegExp(`^(${Bf(r.source)}|null)$`) : void 0
    }), Je(n._zod, "values", () => i.innerType._zod.values ? new Set([...i.innerType._zod.values, null]) : void 0), n._zod.parse = (r, u) => r.value === null ? r : i.innerType._zod.run(r, u)
}), qx = $("$ZodDefault", (n, i) => {
    ft.init(n, i), n._zod.optin = "optional", Je(n._zod, "values", () => i.innerType._zod.values), n._zod.parse = (r, u) => {
        if (u.direction === "backward") return i.innerType._zod.run(r, u);
        if (r.value === void 0) return r.value = i.defaultValue, r;
        const o = i.innerType._zod.run(r, u);
        return o instanceof Promise ? o.then(f => ky(f, i)) : ky(o, i)
    }
});

function ky(n, i) {
    return n.value === void 0 && (n.value = i.defaultValue), n
}

const Bx = $("$ZodPrefault", (n, i) => {
    ft.init(n, i), n._zod.optin = "optional", Je(n._zod, "values", () => i.innerType._zod.values), n._zod.parse = (r, u) => (u.direction === "backward" || r.value === void 0 && (r.value = i.defaultValue), i.innerType._zod.run(r, u))
}), kx = $("$ZodNonOptional", (n, i) => {
    ft.init(n, i), Je(n._zod, "values", () => {
        const r = i.innerType._zod.values;
        return r ? new Set([...r].filter(u => u !== void 0)) : void 0
    }), n._zod.parse = (r, u) => {
        const o = i.innerType._zod.run(r, u);
        return o instanceof Promise ? o.then(f => Hy(f, n)) : Hy(o, n)
    }
});

function Hy(n, i) {
    return !n.issues.length && n.value === void 0 && n.issues.push({
        code: "invalid_type",
        expected: "nonoptional",
        input: n.value,
        inst: i
    }), n
}

const Hx = $("$ZodCatch", (n, i) => {
    ft.init(n, i), n._zod.optin = "optional", Je(n._zod, "optout", () => i.innerType._zod.optout), Je(n._zod, "values", () => i.innerType._zod.values), n._zod.parse = (r, u) => {
        if (u.direction === "backward") return i.innerType._zod.run(r, u);
        const o = i.innerType._zod.run(r, u);
        return o instanceof Promise ? o.then(f => (r.value = f.value, f.issues.length && (r.value = i.catchValue({
            ...r,
            error: {issues: f.issues.map(d => gi(d, u, vi()))},
            input: r.value
        }), r.issues = [], r.fallback = !0), r)) : (r.value = o.value, o.issues.length && (r.value = i.catchValue({
            ...r,
            error: {issues: o.issues.map(f => gi(f, u, vi()))},
            input: r.value
        }), r.issues = [], r.fallback = !0), r)
    }
}), Vx = $("$ZodPipe", (n, i) => {
    ft.init(n, i), Je(n._zod, "values", () => i.in._zod.values), Je(n._zod, "optin", () => i.in._zod.optin), Je(n._zod, "optout", () => i.out._zod.optout), Je(n._zod, "propValues", () => i.in._zod.propValues), n._zod.parse = (r, u) => {
        if (u.direction === "backward") {
            const f = i.out._zod.run(r, u);
            return f instanceof Promise ? f.then(d => Ku(d, i.in, u)) : Ku(f, i.in, u)
        }
        const o = i.in._zod.run(r, u);
        return o instanceof Promise ? o.then(f => Ku(f, i.out, u)) : Ku(o, i.out, u)
    }
});

function Ku(n, i, r) {
    return n.issues.length ? (n.aborted = !0, n) : i._zod.run({
        value: n.value,
        issues: n.issues,
        fallback: n.fallback
    }, r)
}

const $x = $("$ZodReadonly", (n, i) => {
    ft.init(n, i), Je(n._zod, "propValues", () => i.innerType._zod.propValues), Je(n._zod, "values", () => i.innerType._zod.values), Je(n._zod, "optin", () => i.innerType?._zod?.optin), Je(n._zod, "optout", () => i.innerType?._zod?.optout), n._zod.parse = (r, u) => {
        if (u.direction === "backward") return i.innerType._zod.run(r, u);
        const o = i.innerType._zod.run(r, u);
        return o instanceof Promise ? o.then(Vy) : Vy(o)
    }
});

function Vy(n) {
    return n.value = Object.freeze(n.value), n
}

const Qx = $("$ZodCustom", (n, i) => {
    It.init(n, i), ft.init(n, i), n._zod.parse = (r, u) => r, n._zod.check = r => {
        const u = r.value, o = i.fn(u);
        if (o instanceof Promise) return o.then(f => $y(f, r, u, n));
        $y(o, r, u, n)
    }
});

function $y(n, i, r, u) {
    if (!n) {
        const o = {code: "custom", input: r, inst: u, path: [...u._zod.def.path ?? []], continue: !u._zod.def.abort};
        u._zod.def.params && (o.params = u._zod.def.params), i.issues.push(Or(o))
    }
}

var Qy;

class Yx {
    constructor() {
        this._map = new WeakMap, this._idmap = new Map
    }

    add(i, ...r) {
        const u = r[0];
        return this._map.set(i, u), u && typeof u == "object" && "id" in u && this._idmap.set(u.id, i), this
    }

    clear() {
        return this._map = new WeakMap, this._idmap = new Map, this
    }

    remove(i) {
        const r = this._map.get(i);
        return r && typeof r == "object" && "id" in r && this._idmap.delete(r.id), this._map.delete(i), this
    }

    get(i) {
        const r = i._zod.parent;
        if (r) {
            const u = {...this.get(r) ?? {}};
            delete u.id;
            const o = {...u, ...this._map.get(i)};
            return Object.keys(o).length ? o : void 0
        }
        return this._map.get(i)
    }

    has(i) {
        return this._map.has(i)
    }
}

function Gx() {
    return new Yx
}

(Qy = globalThis).__zod_globalRegistry ?? (Qy.__zod_globalRegistry = Gx());
const br = globalThis.__zod_globalRegistry;

function Fx(n, i) {
    return new n({type: "string", ...me(i)})
}

function Xx(n, i) {
    return new n({type: "string", format: "email", check: "string_format", abort: !1, ...me(i)})
}

function Yy(n, i) {
    return new n({type: "string", format: "guid", check: "string_format", abort: !1, ...me(i)})
}

function Jx(n, i) {
    return new n({type: "string", format: "uuid", check: "string_format", abort: !1, ...me(i)})
}

function Kx(n, i) {
    return new n({type: "string", format: "uuid", check: "string_format", abort: !1, version: "v4", ...me(i)})
}

function Px(n, i) {
    return new n({type: "string", format: "uuid", check: "string_format", abort: !1, version: "v6", ...me(i)})
}

function Ix(n, i) {
    return new n({type: "string", format: "uuid", check: "string_format", abort: !1, version: "v7", ...me(i)})
}

function Wx(n, i) {
    return new n({type: "string", format: "url", check: "string_format", abort: !1, ...me(i)})
}

function ez(n, i) {
    return new n({type: "string", format: "emoji", check: "string_format", abort: !1, ...me(i)})
}

function tz(n, i) {
    return new n({type: "string", format: "nanoid", check: "string_format", abort: !1, ...me(i)})
}

function nz(n, i) {
    return new n({type: "string", format: "cuid", check: "string_format", abort: !1, ...me(i)})
}

function az(n, i) {
    return new n({type: "string", format: "cuid2", check: "string_format", abort: !1, ...me(i)})
}

function iz(n, i) {
    return new n({type: "string", format: "ulid", check: "string_format", abort: !1, ...me(i)})
}

function lz(n, i) {
    return new n({type: "string", format: "xid", check: "string_format", abort: !1, ...me(i)})
}

function rz(n, i) {
    return new n({type: "string", format: "ksuid", check: "string_format", abort: !1, ...me(i)})
}

function uz(n, i) {
    return new n({type: "string", format: "ipv4", check: "string_format", abort: !1, ...me(i)})
}

function sz(n, i) {
    return new n({type: "string", format: "ipv6", check: "string_format", abort: !1, ...me(i)})
}

function oz(n, i) {
    return new n({type: "string", format: "cidrv4", check: "string_format", abort: !1, ...me(i)})
}

function cz(n, i) {
    return new n({type: "string", format: "cidrv6", check: "string_format", abort: !1, ...me(i)})
}

function fz(n, i) {
    return new n({type: "string", format: "base64", check: "string_format", abort: !1, ...me(i)})
}

function dz(n, i) {
    return new n({type: "string", format: "base64url", check: "string_format", abort: !1, ...me(i)})
}

function hz(n, i) {
    return new n({type: "string", format: "e164", check: "string_format", abort: !1, ...me(i)})
}

function mz(n, i) {
    return new n({type: "string", format: "jwt", check: "string_format", abort: !1, ...me(i)})
}

function pz(n, i) {
    return new n({
        type: "string",
        format: "datetime",
        check: "string_format",
        offset: !1,
        local: !1,
        precision: null, ...me(i)
    })
}

function yz(n, i) {
    return new n({type: "string", format: "date", check: "string_format", ...me(i)})
}

function vz(n, i) {
    return new n({type: "string", format: "time", check: "string_format", precision: null, ...me(i)})
}

function gz(n, i) {
    return new n({type: "string", format: "duration", check: "string_format", ...me(i)})
}

function bz(n, i) {
    return new n({type: "number", checks: [], ...me(i)})
}

function _z(n, i) {
    return new n({type: "number", check: "number_format", abort: !1, format: "safeint", ...me(i)})
}

function Sz(n, i) {
    return new n({type: "boolean", ...me(i)})
}

function Ez(n) {
    return new n({type: "unknown"})
}

function xz(n, i) {
    return new n({type: "never", ...me(i)})
}

function Gy(n, i) {
    return new ug({check: "less_than", ...me(i), value: n, inclusive: !1})
}

function Wc(n, i) {
    return new ug({check: "less_than", ...me(i), value: n, inclusive: !0})
}

function Fy(n, i) {
    return new sg({check: "greater_than", ...me(i), value: n, inclusive: !1})
}

function ef(n, i) {
    return new sg({check: "greater_than", ...me(i), value: n, inclusive: !0})
}

function Xy(n, i) {
    return new BE({check: "multiple_of", ...me(i), value: n})
}

function mg(n, i) {
    return new HE({check: "max_length", ...me(i), maximum: n})
}

function cs(n, i) {
    return new VE({check: "min_length", ...me(i), minimum: n})
}

function pg(n, i) {
    return new $E({check: "length_equals", ...me(i), length: n})
}

function zz(n, i) {
    return new QE({check: "string_format", format: "regex", ...me(i), pattern: n})
}

function Oz(n) {
    return new YE({check: "string_format", format: "lowercase", ...me(n)})
}

function Tz(n) {
    return new GE({check: "string_format", format: "uppercase", ...me(n)})
}

function jz(n, i) {
    return new FE({check: "string_format", format: "includes", ...me(i), includes: n})
}

function Az(n, i) {
    return new XE({check: "string_format", format: "starts_with", ...me(i), prefix: n})
}

function Rz(n, i) {
    return new JE({check: "string_format", format: "ends_with", ...me(i), suffix: n})
}

function gl(n) {
    return new KE({check: "overwrite", tx: n})
}

function wz(n) {
    return gl(i => i.normalize(n))
}

function Nz() {
    return gl(n => n.trim())
}

function Cz() {
    return gl(n => n.toLowerCase())
}

function Dz() {
    return gl(n => n.toUpperCase())
}

function Mz() {
    return gl(n => B1(n))
}

function Uz(n, i, r) {
    return new n({type: "array", element: i, ...me(r)})
}

function Zz(n, i, r) {
    return new n({type: "custom", check: "custom", fn: i, ...me(r)})
}

function Lz(n, i) {
    const r = qz(u => (u.addIssue = o => {
        if (typeof o == "string") u.issues.push(Or(o, u.value, r._zod.def)); else {
            const f = o;
            f.fatal && (f.continue = !1), f.code ?? (f.code = "custom"), f.input ?? (f.input = u.value), f.inst ?? (f.inst = r), f.continue ?? (f.continue = !r._zod.def.abort), u.issues.push(Or(f))
        }
    }, n(u.value, u)), i);
    return r
}

function qz(n, i) {
    const r = new It({check: "custom", ...me(i)});
    return r._zod.check = n, r
}

function yg(n) {
    let i = n?.target ?? "draft-2020-12";
    return i === "draft-4" && (i = "draft-04"), i === "draft-7" && (i = "draft-07"), {
        processors: n.processors ?? {},
        metadataRegistry: n?.metadata ?? br,
        target: i,
        unrepresentable: n?.unrepresentable ?? "throw",
        override: n?.override ?? (() => {
        }),
        io: n?.io ?? "output",
        counter: 0,
        seen: new Map,
        cycles: n?.cycles ?? "ref",
        reused: n?.reused ?? "inline",
        external: n?.external ?? void 0
    }
}

function Mt(n, i, r = {path: [], schemaPath: []}) {
    var u;
    const o = n._zod.def, f = i.seen.get(n);
    if (f) return f.count++, r.schemaPath.includes(n) && (f.cycle = r.path), f.schema;
    const d = {schema: {}, count: 1, cycle: void 0, path: r.path};
    i.seen.set(n, d);
    const m = n._zod.toJSONSchema?.();
    if (m) d.schema = m; else {
        const b = {...r, schemaPath: [...r.schemaPath, n], path: r.path};
        if (n._zod.processJSONSchema) n._zod.processJSONSchema(i, d.schema, b); else {
            const T = d.schema, R = i.processors[o.type];
            if (!R) throw new Error(`[toJSONSchema]: Non-representable type encountered: ${o.type}`);
            R(n, i, T, b)
        }
        const S = n._zod.parent;
        S && (d.ref || (d.ref = S), Mt(S, i, b), i.seen.get(S).isParent = !0)
    }
    const y = i.metadataRegistry.get(n);
    return y && Object.assign(d.schema, y), i.io === "input" && Bt(n) && (delete d.schema.examples, delete d.schema.default), i.io === "input" && "_prefault" in d.schema && ((u = d.schema).default ?? (u.default = d.schema._prefault)), delete d.schema._prefault, i.seen.get(n).schema
}

function vg(n, i) {
    const r = n.seen.get(i);
    if (!r) throw new Error("Unprocessed schema. This is a bug in Zod.");
    const u = new Map;
    for (const d of n.seen.entries()) {
        const m = n.metadataRegistry.get(d[0])?.id;
        if (m) {
            const y = u.get(m);
            if (y && y !== d[0]) throw new Error(`Duplicate schema id "${m}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
            u.set(m, d[0])
        }
    }
    const o = d => {
        const m = n.target === "draft-2020-12" ? "$defs" : "definitions";
        if (n.external) {
            const S = n.external.registry.get(d[0])?.id, T = n.external.uri ?? (q => q);
            if (S) return {ref: T(S)};
            const R = d[1].defId ?? d[1].schema.id ?? `schema${n.counter++}`;
            return d[1].defId = R, {defId: R, ref: `${T("__shared")}#/${m}/${R}`}
        }
        if (d[1] === r) return {ref: "#"};
        const v = `#/${m}/`, b = d[1].schema.id ?? `__schema${n.counter++}`;
        return {defId: b, ref: v + b}
    }, f = d => {
        if (d[1].schema.$ref) return;
        const m = d[1], {ref: y, defId: v} = o(d);
        m.def = {...m.schema}, v && (m.defId = v);
        const b = m.schema;
        for (const S in b) delete b[S];
        b.$ref = y
    };
    if (n.cycles === "throw") for (const d of n.seen.entries()) {
        const m = d[1];
        if (m.cycle) throw new Error(`Cycle detected: #/${m.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`)
    }
    for (const d of n.seen.entries()) {
        const m = d[1];
        if (i === d[0]) {
            f(d);
            continue
        }
        if (n.external) {
            const v = n.external.registry.get(d[0])?.id;
            if (i !== d[0] && v) {
                f(d);
                continue
            }
        }
        if (n.metadataRegistry.get(d[0])?.id) {
            f(d);
            continue
        }
        if (m.cycle) {
            f(d);
            continue
        }
        if (m.count > 1 && n.reused === "ref") {
            f(d);
            continue
        }
    }
}

function gg(n, i) {
    const r = n.seen.get(i);
    if (!r) throw new Error("Unprocessed schema. This is a bug in Zod.");
    const u = m => {
        const y = n.seen.get(m);
        if (y.ref === null) return;
        const v = y.def ?? y.schema, b = {...v}, S = y.ref;
        if (y.ref = null, S) {
            u(S);
            const R = n.seen.get(S), q = R.schema;
            if (q.$ref && (n.target === "draft-07" || n.target === "draft-04" || n.target === "openapi-3.0") ? (v.allOf = v.allOf ?? [], v.allOf.push(q)) : Object.assign(v, q), Object.assign(v, b), m._zod.parent === S) for (const U in v) U === "$ref" || U === "allOf" || U in b || delete v[U];
            if (q.$ref && R.def) for (const U in v) U === "$ref" || U === "allOf" || U in R.def && JSON.stringify(v[U]) === JSON.stringify(R.def[U]) && delete v[U]
        }
        const T = m._zod.parent;
        if (T && T !== S) {
            u(T);
            const R = n.seen.get(T);
            if (R?.schema.$ref && (v.$ref = R.schema.$ref, R.def)) for (const q in v) q === "$ref" || q === "allOf" || q in R.def && JSON.stringify(v[q]) === JSON.stringify(R.def[q]) && delete v[q]
        }
        n.override({zodSchema: m, jsonSchema: v, path: y.path ?? []})
    };
    for (const m of [...n.seen.entries()].reverse()) u(m[0]);
    const o = {};
    if (n.target === "draft-2020-12" ? o.$schema = "https://json-schema.org/draft/2020-12/schema" : n.target === "draft-07" ? o.$schema = "http://json-schema.org/draft-07/schema#" : n.target === "draft-04" ? o.$schema = "http://json-schema.org/draft-04/schema#" : n.target, n.external?.uri) {
        const m = n.external.registry.get(i)?.id;
        if (!m) throw new Error("Schema is missing an `id` property");
        o.$id = n.external.uri(m)
    }
    Object.assign(o, r.def ?? r.schema);
    const f = n.metadataRegistry.get(i)?.id;
    f !== void 0 && o.id === f && delete o.id;
    const d = n.external?.defs ?? {};
    for (const m of n.seen.entries()) {
        const y = m[1];
        y.def && y.defId && (y.def.id === y.defId && delete y.def.id, d[y.defId] = y.def)
    }
    n.external || Object.keys(d).length > 0 && (n.target === "draft-2020-12" ? o.$defs = d : o.definitions = d);
    try {
        const m = JSON.parse(JSON.stringify(o));
        return Object.defineProperty(m, "~standard", {
            value: {
                ...i["~standard"],
                jsonSchema: {input: fs(i, "input", n.processors), output: fs(i, "output", n.processors)}
            }, enumerable: !1, writable: !1
        }), m
    } catch {
        throw new Error("Error converting schema to JSON.")
    }
}

function Bt(n, i) {
    const r = i ?? {seen: new Set};
    if (r.seen.has(n)) return !1;
    r.seen.add(n);
    const u = n._zod.def;
    if (u.type === "transform") return !0;
    if (u.type === "array") return Bt(u.element, r);
    if (u.type === "set") return Bt(u.valueType, r);
    if (u.type === "lazy") return Bt(u.getter(), r);
    if (u.type === "promise" || u.type === "optional" || u.type === "nonoptional" || u.type === "nullable" || u.type === "readonly" || u.type === "default" || u.type === "prefault") return Bt(u.innerType, r);
    if (u.type === "intersection") return Bt(u.left, r) || Bt(u.right, r);
    if (u.type === "record" || u.type === "map") return Bt(u.keyType, r) || Bt(u.valueType, r);
    if (u.type === "pipe") return n._zod.traits.has("$ZodCodec") ? !0 : Bt(u.in, r) || Bt(u.out, r);
    if (u.type === "object") {
        for (const o in u.shape) if (Bt(u.shape[o], r)) return !0;
        return !1
    }
    if (u.type === "union") {
        for (const o of u.options) if (Bt(o, r)) return !0;
        return !1
    }
    if (u.type === "tuple") {
        for (const o of u.items) if (Bt(o, r)) return !0;
        return !!(u.rest && Bt(u.rest, r))
    }
    return !1
}

const Bz = (n, i = {}) => r => {
    const u = yg({...r, processors: i});
    return Mt(n, u), vg(u, n), gg(u, n)
}, fs = (n, i, r = {}) => u => {
    const {libraryOptions: o, target: f} = u ?? {}, d = yg({...o ?? {}, target: f, io: i, processors: r});
    return Mt(n, d), vg(d, n), gg(d, n)
}, kz = {guid: "uuid", url: "uri", datetime: "date-time", json_string: "json-string", regex: ""}, Hz = (n, i, r, u) => {
    const o = r;
    o.type = "string";
    const {minimum: f, maximum: d, format: m, patterns: y, contentEncoding: v} = n._zod.bag;
    if (typeof f == "number" && (o.minLength = f), typeof d == "number" && (o.maxLength = d), m && (o.format = kz[m] ?? m, o.format === "" && delete o.format, m === "time" && delete o.format), v && (o.contentEncoding = v), y && y.size > 0) {
        const b = [...y];
        b.length === 1 ? o.pattern = b[0].source : b.length > 1 && (o.allOf = [...b.map(S => ({
            ...i.target === "draft-07" || i.target === "draft-04" || i.target === "openapi-3.0" ? {type: "string"} : {},
            pattern: S.source
        }))])
    }
}, Vz = (n, i, r, u) => {
    const o = r, {
        minimum: f,
        maximum: d,
        format: m,
        multipleOf: y,
        exclusiveMaximum: v,
        exclusiveMinimum: b
    } = n._zod.bag;
    typeof m == "string" && m.includes("int") ? o.type = "integer" : o.type = "number";
    const S = typeof b == "number" && b >= (f ?? Number.NEGATIVE_INFINITY),
        T = typeof v == "number" && v <= (d ?? Number.POSITIVE_INFINITY),
        R = i.target === "draft-04" || i.target === "openapi-3.0";
    S ? R ? (o.minimum = b, o.exclusiveMinimum = !0) : o.exclusiveMinimum = b : typeof f == "number" && (o.minimum = f), T ? R ? (o.maximum = v, o.exclusiveMaximum = !0) : o.exclusiveMaximum = v : typeof d == "number" && (o.maximum = d), typeof y == "number" && (o.multipleOf = y)
}, $z = (n, i, r, u) => {
    r.type = "boolean"
}, Qz = (n, i, r, u) => {
    r.not = {}
}, Yz = (n, i, r, u) => {
}, Gz = (n, i, r, u) => {
    const o = n._zod.def, f = Iv(o.entries);
    f.every(d => typeof d == "number") && (r.type = "number"), f.every(d => typeof d == "string") && (r.type = "string"), r.enum = f
}, Fz = (n, i, r, u) => {
    const o = n._zod.def, f = [];
    for (const d of o.values) if (d === void 0) {
        if (i.unrepresentable === "throw") throw new Error("Literal `undefined` cannot be represented in JSON Schema")
    } else if (typeof d == "bigint") {
        if (i.unrepresentable === "throw") throw new Error("BigInt literals cannot be represented in JSON Schema");
        f.push(Number(d))
    } else f.push(d);
    if (f.length !== 0) if (f.length === 1) {
        const d = f[0];
        r.type = d === null ? "null" : typeof d, i.target === "draft-04" || i.target === "openapi-3.0" ? r.enum = [d] : r.const = d
    } else f.every(d => typeof d == "number") && (r.type = "number"), f.every(d => typeof d == "string") && (r.type = "string"), f.every(d => typeof d == "boolean") && (r.type = "boolean"), f.every(d => d === null) && (r.type = "null"), r.enum = f
}, Xz = (n, i, r, u) => {
    if (i.unrepresentable === "throw") throw new Error("Custom types cannot be represented in JSON Schema")
}, Jz = (n, i, r, u) => {
    if (i.unrepresentable === "throw") throw new Error("Transforms cannot be represented in JSON Schema")
}, Kz = (n, i, r, u) => {
    const o = r, f = n._zod.def, {minimum: d, maximum: m} = n._zod.bag;
    typeof d == "number" && (o.minItems = d), typeof m == "number" && (o.maxItems = m), o.type = "array", o.items = Mt(f.element, i, {
        ...u,
        path: [...u.path, "items"]
    })
}, Pz = (n, i, r, u) => {
    const o = r, f = n._zod.def;
    o.type = "object", o.properties = {};
    const d = f.shape;
    for (const v in d) o.properties[v] = Mt(d[v], i, {...u, path: [...u.path, "properties", v]});
    const m = new Set(Object.keys(d)), y = new Set([...m].filter(v => {
        const b = f.shape[v]._zod;
        return i.io === "input" ? b.optin === void 0 : b.optout === void 0
    }));
    y.size > 0 && (o.required = Array.from(y)), f.catchall?._zod.def.type === "never" ? o.additionalProperties = !1 : f.catchall ? f.catchall && (o.additionalProperties = Mt(f.catchall, i, {
        ...u,
        path: [...u.path, "additionalProperties"]
    })) : i.io === "output" && (o.additionalProperties = !1)
}, Iz = (n, i, r, u) => {
    const o = n._zod.def, f = o.inclusive === !1,
        d = o.options.map((m, y) => Mt(m, i, {...u, path: [...u.path, f ? "oneOf" : "anyOf", y]}));
    f ? r.oneOf = d : r.anyOf = d
}, Wz = (n, i, r, u) => {
    const o = n._zod.def, f = Mt(o.left, i, {...u, path: [...u.path, "allOf", 0]}),
        d = Mt(o.right, i, {...u, path: [...u.path, "allOf", 1]}), m = v => "allOf" in v && Object.keys(v).length === 1,
        y = [...m(f) ? f.allOf : [f], ...m(d) ? d.allOf : [d]];
    r.allOf = y
}, eO = (n, i, r, u) => {
    const o = n._zod.def, f = Mt(o.innerType, i, u), d = i.seen.get(n);
    i.target === "openapi-3.0" ? (d.ref = o.innerType, r.nullable = !0) : r.anyOf = [f, {type: "null"}]
}, tO = (n, i, r, u) => {
    const o = n._zod.def;
    Mt(o.innerType, i, u);
    const f = i.seen.get(n);
    f.ref = o.innerType
}, nO = (n, i, r, u) => {
    const o = n._zod.def;
    Mt(o.innerType, i, u);
    const f = i.seen.get(n);
    f.ref = o.innerType, r.default = JSON.parse(JSON.stringify(o.defaultValue))
}, aO = (n, i, r, u) => {
    const o = n._zod.def;
    Mt(o.innerType, i, u);
    const f = i.seen.get(n);
    f.ref = o.innerType, i.io === "input" && (r._prefault = JSON.parse(JSON.stringify(o.defaultValue)))
}, iO = (n, i, r, u) => {
    const o = n._zod.def;
    Mt(o.innerType, i, u);
    const f = i.seen.get(n);
    f.ref = o.innerType;
    let d;
    try {
        d = o.catchValue(void 0)
    } catch {
        throw new Error("Dynamic catch values are not supported in JSON Schema")
    }
    r.default = d
}, lO = (n, i, r, u) => {
    const o = n._zod.def, f = o.in._zod.traits.has("$ZodTransform"), d = i.io === "input" ? f ? o.out : o.in : o.out;
    Mt(d, i, u);
    const m = i.seen.get(n);
    m.ref = d
}, rO = (n, i, r, u) => {
    const o = n._zod.def;
    Mt(o.innerType, i, u);
    const f = i.seen.get(n);
    f.ref = o.innerType, r.readOnly = !0
}, bg = (n, i, r, u) => {
    const o = n._zod.def;
    Mt(o.innerType, i, u);
    const f = i.seen.get(n);
    f.ref = o.innerType
};

function vf() {
    return vf = Object.assign ? Object.assign.bind() : function (n) {
        for (var i = 1; i < arguments.length; i++) {
            var r = arguments[i];
            for (var u in r) ({}).hasOwnProperty.call(r, u) && (n[u] = r[u])
        }
        return n
    }, vf.apply(null, arguments)
}

function Jy(n, i) {
    try {
        var r = n()
    } catch (u) {
        return i(u)
    }
    return r && r.then ? r.then(void 0, i) : r
}

function uO(n, i) {
    for (var r = {}; n.length;) {
        var u = n[0], o = u.code, f = u.message, d = u.path.join(".");
        if (!r[d]) if ("unionErrors" in u) {
            var m = u.unionErrors[0].errors[0];
            r[d] = {message: m.message, type: m.code}
        } else r[d] = {message: f, type: o};
        if ("unionErrors" in u && u.unionErrors.forEach(function (b) {
            return b.errors.forEach(function (S) {
                return n.push(S)
            })
        }), i) {
            var y = r[d].types, v = y && y[u.code];
            r[d] = Df(d, i, r, o, v ? [].concat(v, u.message) : u.message)
        }
        n.shift()
    }
    return r
}

function sO(n, i) {
    for (var r = {}, u = function () {
        var o = n[0], f = o.code, d = o.message, m = o.path.join(".");
        if (!r[m]) if (o.code === "invalid_union" && o.errors.length > 0) {
            var y = o.errors[0][0];
            r[m] = {message: y.message, type: y.code}
        } else r[m] = {message: d, type: f};
        if (o.code === "invalid_union" && o.errors.forEach(function (S) {
            return S.forEach(function (T) {
                return n.push(vf({}, T, {path: [].concat(o.path, T.path)}))
            })
        }), i) {
            var v = r[m].types, b = v && v[o.code];
            r[m] = Df(m, i, r, f, b ? [].concat(b, o.message) : o.message)
        }
        n.shift()
    }; n.length;) u();
    return r
}

function On(n, i, r) {
    if (r === void 0 && (r = {}), (function (u) {
        return "_def" in u && typeof u._def == "object" && "typeName" in u._def
    })(n)) return function (u, o, f) {
        try {
            return Promise.resolve(Jy(function () {
                return Promise.resolve(n[r.mode === "sync" ? "parse" : "parseAsync"](u, i)).then(function (d) {
                    return f.shouldUseNativeValidation && mf({}, f), {
                        errors: {},
                        values: r.raw ? Object.assign({}, u) : d
                    }
                })
            }, function (d) {
                if ((function (m) {
                    return Array.isArray(m?.issues)
                })(d)) return {
                    values: {},
                    errors: wy(uO(d.errors, !f.shouldUseNativeValidation && f.criteriaMode === "all"), f)
                };
                throw d
            }))
        } catch (d) {
            return Promise.reject(d)
        }
    };
    if ((function (u) {
        return "_zod" in u && typeof u._zod == "object"
    })(n)) return function (u, o, f) {
        try {
            return Promise.resolve(Jy(function () {
                return Promise.resolve((r.mode === "sync" ? eE : tE)(n, u, i)).then(function (d) {
                    return f.shouldUseNativeValidation && mf({}, f), {
                        errors: {},
                        values: r.raw ? Object.assign({}, u) : d
                    }
                })
            }, function (d) {
                if ((function (m) {
                    return m instanceof Hf
                })(d)) return {
                    values: {},
                    errors: wy(sO(d.issues, !f.shouldUseNativeValidation && f.criteriaMode === "all"), f)
                };
                throw d
            }))
        } catch (d) {
            return Promise.reject(d)
        }
    };
    throw new Error("Invalid input: not a Zod schema")
}

class _g extends Error {
    constructor(i, r) {
        super(i), this.status = r
    }

    status
}

async function pe(n, i = {}) {
    const r = await fetch(n, {
        credentials: "include",
        headers: i.body ? {"Content-Type": "application/json", ...i.headers} : i.headers, ...i
    });
    if (!r.ok) throw new _g(await oO(r), r.status);
    if (r.status !== 204) return await r.json()
}

async function oO(n) {
    try {
        const i = await n.json();
        if (typeof i.detail == "string" && /[А-Яа-яЁё]/.test(i.detail)) return i.detail;
        if (Array.isArray(i.detail)) return "Исправьте ошибки в выделенных полях"
    } catch {
        if (n.status === 0) return "Не удалось подключиться к серверу. Проверьте соединение и повторите попытку"
    }
    return n.status === 401 ? "Сессия истекла. Войдите снова" : n.status === 403 ? "У вас нет доступа к этому разделу" : n.status === 404 ? "Организация не найдена или у вас больше нет к ней доступа" : n.status === 409 ? "Клиент или запись с такими данными уже существует" : n.status === 422 ? "Исправьте ошибки в выделенных полях" : n.status === 429 ? "Слишком много запросов. Повторите попытку позже" : n.status >= 500 ? "Сервис временно недоступен. Повторите попытку позже" : "Не удалось выполнить действие"
}

const Pe = {
    me: ["me"],
    orgs: ["organizations"],
    branches: n => ["organizations", n, "branches"],
    clients: n => ["organizations", n, "clients"],
    rules: n => ["organizations", n, "loyalty", "rules"],
    bonusLevels: n => ["organizations", n, "loyalty", "levels"],
    clientLoyalty: (n, i) => ["organizations", n, "loyalty", "client", i]
}, ce = {
    register: n => pe("/auth/register", {method: "POST", body: JSON.stringify(n)}),
    login: n => pe("/auth/login", {method: "POST", body: JSON.stringify(n)}),
    logout: () => pe("/auth/logout", {method: "POST"}),
    me: () => pe("/auth/me"),
    organizations: () => pe("/organizations"),
    createOrganization: n => pe("/organizations", {method: "POST", body: JSON.stringify(n)}),
    branches: n => pe(`/organizations/${n}/branches`),
    createBranch: n => pe("/organizations/branches", {method: "POST", body: JSON.stringify(n)}),
    deleteBranch: n => pe(`/organizations/branches/${n}`, {method: "DELETE"}),
    clients: (n, i = "") => pe(`/crm-api/clients-core/clients/search?organization_id=${n}&query=${encodeURIComponent(i)}`),
    createClient: n => pe("/crm-api/clients-core/clients", {method: "POST", body: JSON.stringify(n)}),
    rules: n => pe(`/loyalty-api/client-bonuses/rules?organization_id=${n}`),
    createRule: n => pe("/loyalty-api/client-bonuses/rules", {method: "POST", body: JSON.stringify(n)}),
    applyRule: (n, i, r) => pe(`/loyalty-api/client-bonuses/rules/${n}/apply`, {
        method: "POST",
        body: JSON.stringify({client_id: i, organization_id: r})
    }),
    bonusLevels: n => pe(`/loyalty-api/client-bonuses/levels?organization_id=${n}`),
    createBonusLevel: n => pe("/loyalty-api/client-bonuses/levels", {method: "POST", body: JSON.stringify(n)}),
    bonusBalance: (n, i = "") => pe(`/loyalty-api/client-bonuses/clients/${n}/balance${i ? `?bonus_type=${encodeURIComponent(i)}` : ""}`),
    bonusHistory: n => pe(`/loyalty-api/client-bonuses/clients/${n}/history`),
    accrueBonus: n => pe("/loyalty-api/client-bonuses/accruals", {method: "POST", body: JSON.stringify(n)}),
    writeOffBonus: n => pe("/loyalty-api/client-bonuses/write-offs", {method: "POST", body: JSON.stringify(n)}),
    expireBonus: n => pe("/loyalty-api/client-bonuses/expirations", {method: "POST", body: JSON.stringify(n)}),
    runBonusExpiration: () => pe("/loyalty-api/client-bonuses/expirations/run", {method: "POST"}),
    subscriptions: n => pe(`/loyalty-api/client-subscriptions/clients/${n}`),
    createSubscription: n => pe("/loyalty-api/client-subscriptions", {method: "POST", body: JSON.stringify(n)}),
    freezeSubscription: (n, i) => pe(`/loyalty-api/client-subscriptions/${n}/freeze`, {
        method: "POST",
        body: JSON.stringify(i)
    }),
    unfreezeSubscription: n => pe(`/loyalty-api/client-subscriptions/${n}/unfreeze`, {method: "POST"}),
    transferSubscription: (n, i) => pe(`/loyalty-api/client-subscriptions/${n}/transfer`, {
        method: "POST",
        body: JSON.stringify({to_client_id: i})
    }),
    addFamilyClient: (n, i) => pe(`/loyalty-api/client-subscriptions/${n}/family-clients`, {
        method: "POST",
        body: JSON.stringify({family_client_id: i})
    }),
    setAutoRenewal: (n, i) => pe(`/loyalty-api/client-subscriptions/${n}/auto-renewal/${i ? "enable" : "disable"}`, {method: "POST"}),
    writeOffSubscriptionVisit: (n, i) => pe(`/loyalty-api/client-subscriptions/${n}/write-off-after-visit`, {
        method: "POST",
        body: JSON.stringify(i)
    }),
    renewSubscription: (n, i) => pe(`/loyalty-api/client-subscriptions/${n}/renew`, {
        method: "POST",
        body: JSON.stringify(i)
    }),
    expireSubscription: n => pe(`/loyalty-api/client-subscriptions/${n}/expire`, {method: "POST"}),
    certificates: n => pe(`/loyalty-api/client-certificates/clients/${n}`),
    createCertificate: n => pe("/loyalty-api/client-certificates", {method: "POST", body: JSON.stringify(n)}),
    useCertificate: (n, i) => pe(`/loyalty-api/client-certificates/${n}/use`, {
        method: "POST",
        body: JSON.stringify(i)
    }),
    transferCertificate: (n, i) => pe(`/loyalty-api/client-certificates/${n}/transfer`, {
        method: "POST",
        body: JSON.stringify({to_client_id: i})
    }),
    refundCertificate: n => pe(`/loyalty-api/client-certificates/${n}/refund`, {
        method: "POST",
        body: JSON.stringify({})
    }),
    convertCertificateToDeposit: n => pe(`/loyalty-api/client-certificates/${n}/convert-to-deposit`, {method: "POST"}),
    expireCertificate: n => pe(`/loyalty-api/client-certificates/${n}/expire`, {method: "POST"}),
    referralStats: n => pe(`/loyalty-api/client-referrals/referrers/${n}/stats`),
    referrals: n => pe(`/loyalty-api/client-referrals/referrers/${n}/referrals`),
    createReferralSource: n => pe("/loyalty-api/client-referrals/sources", {method: "POST", body: JSON.stringify(n)}),
    registerReferralByCode: n => pe("/loyalty-api/client-referrals/register-by-code", {
        method: "POST",
        body: JSON.stringify(n)
    }),
    registerReferralByLink: n => pe("/loyalty-api/client-referrals/register-by-link", {
        method: "POST",
        body: JSON.stringify(n)
    }),
    markReferralFirstVisit: (n, i) => pe(`/loyalty-api/client-referrals/${n}/first-visit`, {
        method: "POST",
        body: JSON.stringify({external_first_visit_id: i})
    }),
    accrueReferralReward: n => pe(`/loyalty-api/client-referrals/${n}/reward/accrue`, {method: "POST"}),
    cancelReferralReward: (n, i) => pe(`/loyalty-api/client-referrals/${n}/reward/cancel`, {
        method: "POST",
        body: JSON.stringify({fraud_reason: i})
    }),
    promotions: n => pe(`/loyalty-api/client-promotions/clients/${n}`),
    createPromotion: n => pe("/loyalty-api/client-promotions", {method: "POST", body: JSON.stringify(n)}),
    applyPromotion: (n, i) => pe(`/loyalty-api/client-promotions/${n}/apply`, {
        method: "POST",
        body: JSON.stringify(i)
    }),
    applyPromotionByCode: n => pe("/loyalty-api/client-promotions/apply-by-promo-code", {
        method: "POST",
        body: JSON.stringify(n)
    }),
    promotionProfitability: (n, i) => pe(`/loyalty-api/client-promotions/${n}/profitability`, {
        method: "POST",
        body: JSON.stringify(i)
    })
}, cO = $("ZodISODateTime", (n, i) => {
    cx.init(n, i), ut.init(n, i)
});

function fO(n) {
    return pz(cO, n)
}

const dO = $("ZodISODate", (n, i) => {
    fx.init(n, i), ut.init(n, i)
});

function hO(n) {
    return yz(dO, n)
}

const mO = $("ZodISOTime", (n, i) => {
    dx.init(n, i), ut.init(n, i)
});

function pO(n) {
    return vz(mO, n)
}

const yO = $("ZodISODuration", (n, i) => {
    hx.init(n, i), ut.init(n, i)
});

function vO(n) {
    return gz(yO, n)
}

const gO = (n, i) => {
        Hf.init(n, i), n.name = "ZodError", Object.defineProperties(n, {
            format: {value: r => W1(n, r)},
            flatten: {value: r => I1(n, r)},
            addIssue: {
                value: r => {
                    n.issues.push(r), n.message = JSON.stringify(n.issues, pf, 2)
                }
            },
            addIssues: {
                value: r => {
                    n.issues.push(...r), n.message = JSON.stringify(n.issues, pf, 2)
                }
            },
            isEmpty: {
                get() {
                    return n.issues.length === 0
                }
            }
        })
    }, An = $("ZodError", gO, {Parent: Error}), bO = bs(An), _O = _s(An), SO = Ss(An), EO = Es(An), xO = iE(An),
    zO = lE(An), OO = rE(An), TO = uE(An), jO = sE(An), AO = oE(An), RO = cE(An), wO = fE(An), Ky = new WeakMap;

function Cr(n, i, r) {
    const u = Object.getPrototypeOf(n);
    let o = Ky.get(u);
    if (o || (o = new Set, Ky.set(u, o)), !o.has(i)) {
        o.add(i);
        for (const f in r) {
            const d = r[f];
            Object.defineProperty(u, f, {
                configurable: !0, enumerable: !1, get() {
                    const m = d.bind(this);
                    return Object.defineProperty(this, f, {configurable: !0, writable: !0, enumerable: !0, value: m}), m
                }, set(m) {
                    Object.defineProperty(this, f, {configurable: !0, writable: !0, enumerable: !0, value: m})
                }
            })
        }
    }
}

const dt = $("ZodType", (n, i) => (ft.init(n, i), Object.assign(n["~standard"], {
    jsonSchema: {
        input: fs(n, "input"),
        output: fs(n, "output")
    }
}), n.toJSONSchema = Bz(n, {}), n.def = i, n.type = i.type, Object.defineProperty(n, "_def", {value: i}), n.parse = (r, u) => bO(n, r, u, {callee: n.parse}), n.safeParse = (r, u) => SO(n, r, u), n.parseAsync = async (r, u) => _O(n, r, u, {callee: n.parseAsync}), n.safeParseAsync = async (r, u) => EO(n, r, u), n.spa = n.safeParseAsync, n.encode = (r, u) => xO(n, r, u), n.decode = (r, u) => zO(n, r, u), n.encodeAsync = async (r, u) => OO(n, r, u), n.decodeAsync = async (r, u) => TO(n, r, u), n.safeEncode = (r, u) => jO(n, r, u), n.safeDecode = (r, u) => AO(n, r, u), n.safeEncodeAsync = async (r, u) => RO(n, r, u), n.safeDecodeAsync = async (r, u) => wO(n, r, u), Cr(n, "ZodType", {
    check(...r) {
        const u = this.def;
        return this.clone(Ya(u, {
            checks: [...u.checks ?? [], ...r.map(o => typeof o == "function" ? {
                _zod: {
                    check: o,
                    def: {check: "custom"},
                    onattach: []
                }
            } : o)]
        }), {parent: !0})
    }, with(...r) {
        return this.check(...r)
    }, clone(r, u) {
        return Ga(this, r, u)
    }, brand() {
        return this
    }, register(r, u) {
        return r.add(this, u), this
    }, refine(r, u) {
        return this.check(OT(r, u))
    }, superRefine(r, u) {
        return this.check(TT(r, u))
    }, overwrite(r) {
        return this.check(gl(r))
    }, optional() {
        return ev(this)
    }, exactOptional() {
        return dT(this)
    }, nullable() {
        return tv(this)
    }, nullish() {
        return ev(tv(this))
    }, nonoptional(r) {
        return gT(this, r)
    }, array() {
        return nT(this)
    }, or(r) {
        return lT([this, r])
    }, and(r) {
        return uT(this, r)
    }, transform(r) {
        return nv(this, cT(r))
    }, default(r) {
        return pT(this, r)
    }, prefault(r) {
        return vT(this, r)
    }, catch(r) {
        return _T(this, r)
    }, pipe(r) {
        return nv(this, r)
    }, readonly() {
        return xT(this)
    }, describe(r) {
        const u = this.clone();
        return br.add(u, {description: r}), u
    }, meta(...r) {
        if (r.length === 0) return br.get(this);
        const u = this.clone();
        return br.add(u, r[0]), u
    }, isOptional() {
        return this.safeParse(void 0).success
    }, isNullable() {
        return this.safeParse(null).success
    }, apply(r) {
        return r(this)
    }
}), Object.defineProperty(n, "description", {
    get() {
        return br.get(n)?.description
    }, configurable: !0
}), n)), Sg = $("_ZodString", (n, i) => {
    Vf.init(n, i), dt.init(n, i), n._zod.processJSONSchema = (u, o, f) => Hz(n, u, o);
    const r = n._zod.bag;
    n.format = r.format ?? null, n.minLength = r.minimum ?? null, n.maxLength = r.maximum ?? null, Cr(n, "_ZodString", {
        regex(...u) {
            return this.check(zz(...u))
        }, includes(...u) {
            return this.check(jz(...u))
        }, startsWith(...u) {
            return this.check(Az(...u))
        }, endsWith(...u) {
            return this.check(Rz(...u))
        }, min(...u) {
            return this.check(cs(...u))
        }, max(...u) {
            return this.check(mg(...u))
        }, length(...u) {
            return this.check(pg(...u))
        }, nonempty(...u) {
            return this.check(cs(1, ...u))
        }, lowercase(u) {
            return this.check(Oz(u))
        }, uppercase(u) {
            return this.check(Tz(u))
        }, trim() {
            return this.check(Nz())
        }, normalize(...u) {
            return this.check(wz(...u))
        }, toLowerCase() {
            return this.check(Cz())
        }, toUpperCase() {
            return this.check(Dz())
        }, slugify() {
            return this.check(Mz())
        }
    })
}), NO = $("ZodString", (n, i) => {
    Vf.init(n, i), Sg.init(n, i), n.email = r => n.check(Xx(CO, r)), n.url = r => n.check(Wx(DO, r)), n.jwt = r => n.check(mz(XO, r)), n.emoji = r => n.check(ez(MO, r)), n.guid = r => n.check(Yy(Py, r)), n.uuid = r => n.check(Jx(Pu, r)), n.uuidv4 = r => n.check(Kx(Pu, r)), n.uuidv6 = r => n.check(Px(Pu, r)), n.uuidv7 = r => n.check(Ix(Pu, r)), n.nanoid = r => n.check(tz(UO, r)), n.guid = r => n.check(Yy(Py, r)), n.cuid = r => n.check(nz(ZO, r)), n.cuid2 = r => n.check(az(LO, r)), n.ulid = r => n.check(iz(qO, r)), n.base64 = r => n.check(fz(YO, r)), n.base64url = r => n.check(dz(GO, r)), n.xid = r => n.check(lz(BO, r)), n.ksuid = r => n.check(rz(kO, r)), n.ipv4 = r => n.check(uz(HO, r)), n.ipv6 = r => n.check(sz(VO, r)), n.cidrv4 = r => n.check(oz($O, r)), n.cidrv6 = r => n.check(cz(QO, r)), n.e164 = r => n.check(hz(FO, r)), n.datetime = r => n.check(fO(r)), n.date = r => n.check(hO(r)), n.time = r => n.check(pO(r)), n.duration = r => n.check(vO(r))
});

function Ue(n) {
    return Fx(NO, n)
}

const ut = $("ZodStringFormat", (n, i) => {
    it.init(n, i), Sg.init(n, i)
}), CO = $("ZodEmail", (n, i) => {
    tx.init(n, i), ut.init(n, i)
}), Py = $("ZodGUID", (n, i) => {
    WE.init(n, i), ut.init(n, i)
}), Pu = $("ZodUUID", (n, i) => {
    ex.init(n, i), ut.init(n, i)
}), DO = $("ZodURL", (n, i) => {
    nx.init(n, i), ut.init(n, i)
}), MO = $("ZodEmoji", (n, i) => {
    ax.init(n, i), ut.init(n, i)
}), UO = $("ZodNanoID", (n, i) => {
    ix.init(n, i), ut.init(n, i)
}), ZO = $("ZodCUID", (n, i) => {
    lx.init(n, i), ut.init(n, i)
}), LO = $("ZodCUID2", (n, i) => {
    rx.init(n, i), ut.init(n, i)
}), qO = $("ZodULID", (n, i) => {
    ux.init(n, i), ut.init(n, i)
}), BO = $("ZodXID", (n, i) => {
    sx.init(n, i), ut.init(n, i)
}), kO = $("ZodKSUID", (n, i) => {
    ox.init(n, i), ut.init(n, i)
}), HO = $("ZodIPv4", (n, i) => {
    mx.init(n, i), ut.init(n, i)
}), VO = $("ZodIPv6", (n, i) => {
    px.init(n, i), ut.init(n, i)
}), $O = $("ZodCIDRv4", (n, i) => {
    yx.init(n, i), ut.init(n, i)
}), QO = $("ZodCIDRv6", (n, i) => {
    vx.init(n, i), ut.init(n, i)
}), YO = $("ZodBase64", (n, i) => {
    gx.init(n, i), ut.init(n, i)
}), GO = $("ZodBase64URL", (n, i) => {
    _x.init(n, i), ut.init(n, i)
}), FO = $("ZodE164", (n, i) => {
    Sx.init(n, i), ut.init(n, i)
}), XO = $("ZodJWT", (n, i) => {
    xx.init(n, i), ut.init(n, i)
}), Eg = $("ZodNumber", (n, i) => {
    cg.init(n, i), dt.init(n, i), n._zod.processJSONSchema = (u, o, f) => Vz(n, u, o), Cr(n, "ZodNumber", {
        gt(u, o) {
            return this.check(Fy(u, o))
        }, gte(u, o) {
            return this.check(ef(u, o))
        }, min(u, o) {
            return this.check(ef(u, o))
        }, lt(u, o) {
            return this.check(Gy(u, o))
        }, lte(u, o) {
            return this.check(Wc(u, o))
        }, max(u, o) {
            return this.check(Wc(u, o))
        }, int(u) {
            return this.check(Iy(u))
        }, safe(u) {
            return this.check(Iy(u))
        }, positive(u) {
            return this.check(Fy(0, u))
        }, nonnegative(u) {
            return this.check(ef(0, u))
        }, negative(u) {
            return this.check(Gy(0, u))
        }, nonpositive(u) {
            return this.check(Wc(0, u))
        }, multipleOf(u, o) {
            return this.check(Xy(u, o))
        }, step(u, o) {
            return this.check(Xy(u, o))
        }, finite() {
            return this
        }
    });
    const r = n._zod.bag;
    n.minValue = Math.max(r.minimum ?? Number.NEGATIVE_INFINITY, r.exclusiveMinimum ?? Number.NEGATIVE_INFINITY) ?? null, n.maxValue = Math.min(r.maximum ?? Number.POSITIVE_INFINITY, r.exclusiveMaximum ?? Number.POSITIVE_INFINITY) ?? null, n.isInt = (r.format ?? "").includes("int") || Number.isSafeInteger(r.multipleOf ?? .5), n.isFinite = !0, n.format = r.format ?? null
});

function Vt(n) {
    return bz(Eg, n)
}

const JO = $("ZodNumberFormat", (n, i) => {
    zx.init(n, i), Eg.init(n, i)
});

function Iy(n) {
    return _z(JO, n)
}

const KO = $("ZodBoolean", (n, i) => {
    Ox.init(n, i), dt.init(n, i), n._zod.processJSONSchema = (r, u, o) => $z(n, r, u)
});

function PO(n) {
    return Sz(KO, n)
}

const IO = $("ZodUnknown", (n, i) => {
    Tx.init(n, i), dt.init(n, i), n._zod.processJSONSchema = (r, u, o) => Yz()
});

function Wy() {
    return Ez(IO)
}

const WO = $("ZodNever", (n, i) => {
    jx.init(n, i), dt.init(n, i), n._zod.processJSONSchema = (r, u, o) => Qz(n, r, u)
});

function eT(n) {
    return xz(WO, n)
}

const tT = $("ZodArray", (n, i) => {
    Ax.init(n, i), dt.init(n, i), n._zod.processJSONSchema = (r, u, o) => Kz(n, r, u, o), n.element = i.element, Cr(n, "ZodArray", {
        min(r, u) {
            return this.check(cs(r, u))
        }, nonempty(r) {
            return this.check(cs(1, r))
        }, max(r, u) {
            return this.check(mg(r, u))
        }, length(r, u) {
            return this.check(pg(r, u))
        }, unwrap() {
            return this.element
        }
    })
});

function nT(n, i) {
    return Uz(tT, n, i)
}

const aT = $("ZodObject", (n, i) => {
    wx.init(n, i), dt.init(n, i), n._zod.processJSONSchema = (r, u, o) => Pz(n, r, u, o), Je(n, "shape", () => i.shape), Cr(n, "ZodObject", {
        keyof() {
            return $f(Object.keys(this._zod.def.shape))
        }, catchall(r) {
            return this.clone({...this._zod.def, catchall: r})
        }, passthrough() {
            return this.clone({...this._zod.def, catchall: Wy()})
        }, loose() {
            return this.clone({...this._zod.def, catchall: Wy()})
        }, strict() {
            return this.clone({...this._zod.def, catchall: eT()})
        }, strip() {
            return this.clone({...this._zod.def, catchall: void 0})
        }, extend(r) {
            return G1(this, r)
        }, safeExtend(r) {
            return F1(this, r)
        }, merge(r) {
            return X1(this, r)
        }, pick(r) {
            return Q1(this, r)
        }, omit(r) {
            return Y1(this, r)
        }, partial(...r) {
            return J1(xg, this, r[0])
        }, required(...r) {
            return K1(zg, this, r[0])
        }
    })
});

function Rn(n, i) {
    const r = {type: "object", shape: n ?? {}, ...me(i)};
    return new aT(r)
}

const iT = $("ZodUnion", (n, i) => {
    Nx.init(n, i), dt.init(n, i), n._zod.processJSONSchema = (r, u, o) => Iz(n, r, u, o), n.options = i.options
});

function lT(n, i) {
    return new iT({type: "union", options: n, ...me(i)})
}

const rT = $("ZodIntersection", (n, i) => {
    Cx.init(n, i), dt.init(n, i), n._zod.processJSONSchema = (r, u, o) => Wz(n, r, u, o)
});

function uT(n, i) {
    return new rT({type: "intersection", left: n, right: i})
}

const gf = $("ZodEnum", (n, i) => {
    Dx.init(n, i), dt.init(n, i), n._zod.processJSONSchema = (u, o, f) => Gz(n, u, o), n.enum = i.entries, n.options = Object.values(i.entries);
    const r = new Set(Object.keys(i.entries));
    n.extract = (u, o) => {
        const f = {};
        for (const d of u) if (r.has(d)) f[d] = i.entries[d]; else throw new Error(`Key ${d} not found in enum`);
        return new gf({...i, checks: [], ...me(o), entries: f})
    }, n.exclude = (u, o) => {
        const f = {...i.entries};
        for (const d of u) if (r.has(d)) delete f[d]; else throw new Error(`Key ${d} not found in enum`);
        return new gf({...i, checks: [], ...me(o), entries: f})
    }
});

function $f(n, i) {
    const r = Array.isArray(n) ? Object.fromEntries(n.map(u => [u, u])) : n;
    return new gf({type: "enum", entries: r, ...me(i)})
}

const sT = $("ZodLiteral", (n, i) => {
    Mx.init(n, i), dt.init(n, i), n._zod.processJSONSchema = (r, u, o) => Fz(n, r, u), n.values = new Set(i.values), Object.defineProperty(n, "value", {
        get() {
            if (i.values.length > 1) throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
            return i.values[0]
        }
    })
});

function zs(n, i) {
    return new sT({type: "literal", values: Array.isArray(n) ? n : [n], ...me(i)})
}

const oT = $("ZodTransform", (n, i) => {
    Ux.init(n, i), dt.init(n, i), n._zod.processJSONSchema = (r, u, o) => Jz(n, r), n._zod.parse = (r, u) => {
        if (u.direction === "backward") throw new Pv(n.constructor.name);
        r.addIssue = f => {
            if (typeof f == "string") r.issues.push(Or(f, r.value, i)); else {
                const d = f;
                d.fatal && (d.continue = !1), d.code ?? (d.code = "custom"), d.input ?? (d.input = r.value), d.inst ?? (d.inst = n), r.issues.push(Or(d))
            }
        };
        const o = i.transform(r.value, r);
        return o instanceof Promise ? o.then(f => (r.value = f, r.fallback = !0, r)) : (r.value = o, r.fallback = !0, r)
    }
});

function cT(n) {
    return new oT({type: "transform", transform: n})
}

const xg = $("ZodOptional", (n, i) => {
    hg.init(n, i), dt.init(n, i), n._zod.processJSONSchema = (r, u, o) => bg(n, r, u, o), n.unwrap = () => n._zod.def.innerType
});

function ev(n) {
    return new xg({type: "optional", innerType: n})
}

const fT = $("ZodExactOptional", (n, i) => {
    Zx.init(n, i), dt.init(n, i), n._zod.processJSONSchema = (r, u, o) => bg(n, r, u, o), n.unwrap = () => n._zod.def.innerType
});

function dT(n) {
    return new fT({type: "optional", innerType: n})
}

const hT = $("ZodNullable", (n, i) => {
    Lx.init(n, i), dt.init(n, i), n._zod.processJSONSchema = (r, u, o) => eO(n, r, u, o), n.unwrap = () => n._zod.def.innerType
});

function tv(n) {
    return new hT({type: "nullable", innerType: n})
}

const mT = $("ZodDefault", (n, i) => {
    qx.init(n, i), dt.init(n, i), n._zod.processJSONSchema = (r, u, o) => nO(n, r, u, o), n.unwrap = () => n._zod.def.innerType, n.removeDefault = n.unwrap
});

function pT(n, i) {
    return new mT({
        type: "default", innerType: n, get defaultValue() {
            return typeof i == "function" ? i() : eg(i)
        }
    })
}

const yT = $("ZodPrefault", (n, i) => {
    Bx.init(n, i), dt.init(n, i), n._zod.processJSONSchema = (r, u, o) => aO(n, r, u, o), n.unwrap = () => n._zod.def.innerType
});

function vT(n, i) {
    return new yT({
        type: "prefault", innerType: n, get defaultValue() {
            return typeof i == "function" ? i() : eg(i)
        }
    })
}

const zg = $("ZodNonOptional", (n, i) => {
    kx.init(n, i), dt.init(n, i), n._zod.processJSONSchema = (r, u, o) => tO(n, r, u, o), n.unwrap = () => n._zod.def.innerType
});

function gT(n, i) {
    return new zg({type: "nonoptional", innerType: n, ...me(i)})
}

const bT = $("ZodCatch", (n, i) => {
    Hx.init(n, i), dt.init(n, i), n._zod.processJSONSchema = (r, u, o) => iO(n, r, u, o), n.unwrap = () => n._zod.def.innerType, n.removeCatch = n.unwrap
});

function _T(n, i) {
    return new bT({type: "catch", innerType: n, catchValue: typeof i == "function" ? i : () => i})
}

const ST = $("ZodPipe", (n, i) => {
    Vx.init(n, i), dt.init(n, i), n._zod.processJSONSchema = (r, u, o) => lO(n, r, u, o), n.in = i.in, n.out = i.out
});

function nv(n, i) {
    return new ST({type: "pipe", in: n, out: i})
}

const ET = $("ZodReadonly", (n, i) => {
    $x.init(n, i), dt.init(n, i), n._zod.processJSONSchema = (r, u, o) => rO(n, r, u, o), n.unwrap = () => n._zod.def.innerType
});

function xT(n) {
    return new ET({type: "readonly", innerType: n})
}

const zT = $("ZodCustom", (n, i) => {
    Qx.init(n, i), dt.init(n, i), n._zod.processJSONSchema = (r, u, o) => Xz(n, r)
});

function OT(n, i = {}) {
    return Zz(zT, n, i)
}

function TT(n, i) {
    return Lz(n, i)
}

const jT = Rn({login: Ue().min(1, "Укажите email или телефон"), password: Ue().min(1, "Укажите пароль")}), AT = Rn({
        name: Ue().min(1, "Укажите имя"),
        email: Ue().email("Укажите корректный email").optional().or(zs("")),
        phone: Ue().optional(),
        password: Ue().min(8, "Минимум 8 символов"),
        confirm: Ue().min(1, "Повторите пароль")
    }).refine(n => n.password === n.confirm, {message: "Пароли не совпадают", path: ["confirm"]}),
    RT = Rn({name: Ue().min(2, "Укажите название организации")}), wT = Rn({
        name: Ue().min(2, "Укажите название филиала"),
        address: Ue().optional(),
        phone: Ue().optional(),
        timezone: Ue().optional()
    }), NT = Rn({
        first_name: Ue().optional(),
        last_name: Ue().optional(),
        primary_phone: Ue().optional(),
        email: Ue().email("Укажите корректный email").optional().or(zs(""))
    }), CT = Rn({
        name: Ue().min(2, "Укажите название правила"),
        rule_type: $f(["welcome", "birthday", "referral", "service", "product"]),
        bonus_type: Ue().min(1, "Укажите тип бонусов"),
        amount: Vt().int().positive("Сумма должна быть больше нуля"),
        expires_in_days: Vt().int().positive().optional().or(zs(""))
    }), DT = Rn({
        client_id: Vt().int().positive("Выберите клиента"),
        amount: Vt().int().positive("Сумма должна быть больше нуля"),
        bonus_type: Ue().min(1, "Укажите тип бонусов"),
        reason: Ue().min(1, "Укажите причину"),
        expires_at: Ue().optional()
    }), MT = Rn({name: Ue().min(2, "Укажите название уровня")}), UT = Rn({
        client_id: Vt().int().positive("Выберите клиента"),
        subscription_name: Ue().min(2, "Укажите название абонемента"),
        visits_total: Vt().int().min(0),
        deposit_amount: Vt().min(0),
        expires_at: Ue().optional(),
        auto_renewal_enabled: PO().optional()
    }), ZT = Rn({
        client_id: Vt().int().positive("Выберите клиента"),
        certificate_type: $f(["digital", "paper"]),
        certificate_code: Ue().min(2, "Укажите код сертификата"),
        nominal_amount: Vt().min(0),
        expires_at: Ue().optional()
    }), LT = Rn({
        referrer_client_id: Vt().int().positive("Выберите клиента"),
        referral_code: Ue().min(2, "Укажите код"),
        referral_link: Ue().min(2, "Укажите ссылку"),
        reward_type: Ue().min(1),
        reward_bonus_type: Ue().optional(),
        reward_amount: Vt().min(0)
    }), qT = Rn({
        client_id: Vt().int().positive("Выберите клиента"),
        promotion_name: Ue().min(2, "Укажите название акции"),
        promotion_type: Ue().min(1),
        promo_code: Ue().optional(),
        discount_type: Ue().optional(),
        discount_value: Vt().min(0),
        gift: Ue().optional(),
        min_amount: Vt().min(0),
        usage_limit: Vt().int().positive().optional().or(zs(""))
    }), Qf = "loyalty.lastOrganizationId";

function BT() {
    return p.jsxs(LS, {
        children: [p.jsx(_t, {path: "/login", element: p.jsx(av, {mode: "login"})}), p.jsx(_t, {
            path: "/register",
            element: p.jsx(av, {mode: "register"})
        }), p.jsxs(_t, {
            element: p.jsx(kT, {}),
            children: [p.jsx(_t, {
                path: "/onboarding",
                element: p.jsx(VT, {})
            }), p.jsx(_t, {
                path: "/organizations/:organizationId",
                element: p.jsx(sn, {page: "Обзор", children: p.jsx($T, {})})
            }), p.jsx(_t, {
                path: "/organizations/:organizationId/branches",
                element: p.jsx(sn, {page: "Филиалы", children: p.jsx(QT, {})})
            }), p.jsx(_t, {
                path: "/organizations/:organizationId/clients",
                element: p.jsx(sn, {page: "Клиенты", children: p.jsx(iv, {})})
            }), p.jsx(_t, {
                path: "/organizations/:organizationId/clients/:clientId",
                element: p.jsx(sn, {page: "Клиент", children: p.jsx(iv, {})})
            }), p.jsx(_t, {
                path: "/organizations/:organizationId/loyalty",
                element: p.jsx(sn, {page: "Лояльность", children: p.jsx(Va, {})})
            }), p.jsx(_t, {
                path: "/organizations/:organizationId/loyalty/rules",
                element: p.jsx(sn, {page: "Правила начисления", children: p.jsx(Va, {})})
            }), p.jsx(_t, {
                path: "/organizations/:organizationId/loyalty/levels",
                element: p.jsx(sn, {page: "Уровни клиентов", children: p.jsx(Va, {})})
            }), p.jsx(_t, {
                path: "/organizations/:organizationId/loyalty/transactions",
                element: p.jsx(sn, {page: "Транзакции", children: p.jsx(Va, {})})
            }), p.jsx(_t, {
                path: "/organizations/:organizationId/loyalty/promotions",
                element: p.jsx(sn, {page: "Акции", children: p.jsx(Va, {})})
            }), p.jsx(_t, {
                path: "/organizations/:organizationId/loyalty/certificates",
                element: p.jsx(sn, {page: "Сертификаты", children: p.jsx(Va, {})})
            }), p.jsx(_t, {
                path: "/organizations/:organizationId/loyalty/subscriptions",
                element: p.jsx(sn, {page: "Абонементы", children: p.jsx(Va, {})})
            }), p.jsx(_t, {
                path: "/organizations/:organizationId/loyalty/referrals",
                element: p.jsx(sn, {page: "Реферальная программа", children: p.jsx(Va, {})})
            }), p.jsx(_t, {
                path: "/organizations/:organizationId/settings",
                element: p.jsx(sn, {page: "Настройки оранизации", children: p.jsx(YT, {})})
            }), p.jsx(_t, {path: "/", element: p.jsx(HT, {})})]
        }), p.jsx(_t, {path: "*", element: p.jsx(FT, {})})]
    })
}

function kT() {
    const n = xt({queryKey: Pe.me, queryFn: ce.me, retry: !1});
    return n.isLoading ? p.jsx(Mr, {text: "Проверяем сессию..."}) : n.isError ? p.jsx(of, {
        to: "/login",
        replace: !0
    }) : p.jsx(US, {})
}

function HT() {
    const n = xt({queryKey: Pe.orgs, queryFn: ce.organizations});
    if (n.isLoading) return p.jsx(Mr, {text: "Загружаем организации..."});
    if (n.isError) return p.jsx(Yf, {error: n.error, retry: () => n.refetch()});
    const i = n.data ?? [];
    if (!i.length) return p.jsx(of, {to: "/onboarding", replace: !0});
    const r = Number(localStorage.getItem(Qf)), u = i.find(o => o.id === r) ?? i[0];
    return p.jsx(of, {to: `/organizations/${u.id}`, replace: !0})
}

function av({mode: n}) {
    const i = jr(), r = Qa(), [u, o] = D.useState(!1), f = n === "login", d = zn({resolver: On(jT)}),
        m = zn({resolver: On(AT)}), y = kt({
            mutationFn: v => f ? ce.login(v) : ce.register({
                name: v.name,
                email: v.email || void 0,
                phone: v.phone || void 0,
                password: v.password
            }), onSuccess: async () => {
                await r.invalidateQueries({queryKey: Pe.me}), i("/")
            }
        });
    return p.jsx("main", {
        className: "auth-page", children: p.jsxs("form", {
            className: "auth-card",
            onSubmit: f ? d.handleSubmit(v => y.mutate(v)) : m.handleSubmit(v => y.mutate(v)),
            children: [p.jsx("h1", {children: f ? "Вход" : "Регистрация"}), !f && p.jsx(se, {
                label: "Имя",
                error: m.formState.errors.name?.message,
                children: p.jsx("input", {...m.register("name")})
            }), p.jsx(se, {
                label: f ? "Email или телефон" : "Email",
                error: f ? d.formState.errors.login?.message : m.formState.errors.email?.message,
                children: p.jsx("input", {...f ? d.register("login") : m.register("email")})
            }), !f && p.jsx(se, {
                label: "Телефон",
                error: m.formState.errors.phone?.message,
                children: p.jsx("input", {...m.register("phone")})
            }), p.jsx(se, {
                label: "Пароль",
                error: f ? d.formState.errors.password?.message : m.formState.errors.password?.message,
                children: p.jsxs("div", {
                    className: "password-row",
                    children: [p.jsx("input", {type: u ? "text" : "password", ...f ? d.register("password") : m.register("password")}), p.jsx("button", {
                        type: "button",
                        className: "ghost",
                        onClick: () => o(v => !v),
                        children: u ? "Скрыть" : "Показать"
                    })]
                })
            }), !f && p.jsx(se, {
                label: "Повтор пароля",
                error: m.formState.errors.confirm?.message,
                children: p.jsx("input", {type: "password", ...m.register("confirm")})
            }), y.isError && p.jsx("p", {
                className: "form-error",
                children: on(y.error)
            }), p.jsx("button", {
                className: "primary",
                disabled: y.isPending,
                children: y.isPending ? "Отправляем..." : f ? "Войти" : "Создать аккаунт"
            }), p.jsx(Rr, {to: f ? "/register" : "/login", children: f ? "Создать аккаунт" : "Уже есть аккаунт"})]
        })
    })
}

function VT() {
    const n = jr(), i = Qa(), r = zn({resolver: On(RT)}), u = kt({
        mutationFn: ce.createOrganization, onSuccess: async o => {
            localStorage.setItem(Qf, String(o.id)), await i.invalidateQueries({queryKey: Pe.orgs}), n(`/organizations/${o.id}`)
        }
    });
    return p.jsx("main", {
        className: "auth-page",
        children: p.jsxs("form", {
            className: "auth-card wide",
            onSubmit: r.handleSubmit(o => u.mutate(o)),
            children: [p.jsx("h1", {children: "Создание оранизации"}), p.jsx("p", {children: "После этого откроются филиалы, клиенты и единая программа лояльности организации."}), p.jsx(se, {
                label: "Название организации",
                error: r.formState.errors.name?.message,
                children: p.jsx("input", {...r.register("name")})
            }), u.isError && p.jsx("p", {
                className: "form-error",
                children: on(u.error)
            }), p.jsx("button", {
                className: "primary",
                disabled: u.isPending,
                children: u.isPending ? "Создаём..." : "Создать организацию"
            })]
        })
    })
}

function sn({page: n, children: i}) {
    const {organizationId: r = ""} = Dv(), u = Number(r), o = xt({queryKey: Pe.orgs, queryFn: ce.organizations}),
        f = jr(), d = Qa(), m = kt({
            mutationFn: ce.logout, onSuccess: () => {
                d.clear(), f("/login")
            }
        });
    if (o.isLoading) return p.jsx(Mr, {text: "Загружаем кабинет..."});
    if (o.isError) return p.jsx(Yf, {error: o.error, retry: () => o.refetch()});
    const y = o.data ?? [], v = y.find(b => b.id === u);
    return v ? p.jsxs("div", {
        className: "app",
        children: [p.jsxs("aside", {
            className: "sidebar",
            children: [p.jsx("strong", {
                className: "brand",
                children: "Лояльность"
            }), p.jsx("select", {
                "aria-label": "Организация", value: u, onChange: b => {
                    localStorage.setItem(Qf, b.target.value), f(`/organizations/${b.target.value}`)
                }, children: y.map(b => p.jsx("option", {value: b.id, children: b.name}, b.id))
            }), p.jsx("button", {
                className: "ghost",
                onClick: () => f("/onboarding"),
                children: "Создать организацию"
            }), p.jsxs("nav", {
                children: [p.jsx(yr, {
                    to: `/organizations/${u}`,
                    label: "Обзор"
                }), p.jsx(yr, {
                    to: `/organizations/${u}/clients`,
                    label: "Клиенты"
                }), p.jsx(yr, {
                    to: `/organizations/${u}/loyalty`,
                    label: "Лояльность"
                }), p.jsx(yr, {
                    to: `/organizations/${u}/branches`,
                    label: "Филиалы"
                }), p.jsx(yr, {to: `/organizations/${u}/settings`, label: "Настройки оранизации"})]
            })]
        }), p.jsxs("main", {
            className: "content",
            children: [p.jsxs("header", {
                className: "topbar",
                children: [p.jsxs("div", {children: [p.jsx("span", {children: v.name}), p.jsx("h1", {children: n})]}), p.jsx("button", {
                    className: "ghost",
                    disabled: m.isPending,
                    onClick: () => m.mutate(),
                    children: "Выйти"
                })]
            }), i]
        })]
    }) : p.jsx(GT, {})
}

function $T() {
    const n = Dr(), i = xt({queryKey: Pe.branches(n.id), queryFn: () => ce.branches(n.id)}),
        r = xt({queryKey: Pe.clients(n.id), queryFn: () => ce.clients(n.id)}),
        u = xt({queryKey: Pe.rules(n.id), queryFn: () => ce.rules(n.id)});
    return p.jsxs("section", {
        className: "grid",
        children: [p.jsx(pi, {label: "Филиалов", query: i}), p.jsx(pi, {
            label: "Клиентов",
            query: r
        }), p.jsx(pi, {
            label: "Активных правил",
            query: u,
            value: (u.data ?? []).filter(o => o.is_active).length
        }), p.jsx("div", {className: "panel span"})]
    })
}

function QT() {
    const n = Dr(), i = Qa(), r = zn({resolver: On(wT), defaultValues: {timezone: "Europe/Moscow"}}),
        u = xt({queryKey: Pe.branches(n.id), queryFn: () => ce.branches(n.id)}), o = kt({
            mutationFn: d => ce.createBranch({organization_id: n.id, ...Og(d)}), onSuccess: async () => {
                r.reset({timezone: "Europe/Moscow"}), await i.invalidateQueries({queryKey: Pe.branches(n.id)})
            }
        }), f = kt({
            mutationFn: ce.deleteBranch,
            onSuccess: async () => i.invalidateQueries({queryKey: Pe.branches(n.id)})
        });
    return p.jsxs("section", {
        className: "panel",
        children: [p.jsx("h2", {children: "Филиалы"}), p.jsxs("form", {
            className: "inline-form",
            onSubmit: r.handleSubmit(d => o.mutate(d)),
            children: [p.jsx(se, {
                label: "Название",
                error: r.formState.errors.name?.message,
                children: p.jsx("input", {...r.register("name")})
            }), p.jsx(se, {
                label: "Адрес",
                children: p.jsx("input", {...r.register("address")})
            }), p.jsx(se, {
                label: "Телефон",
                children: p.jsx("input", {...r.register("phone")})
            }), p.jsx(se, {
                label: "Часовой пояс",
                children: p.jsx("input", {...r.register("timezone")})
            }), p.jsx("button", {
                className: "primary",
                disabled: o.isPending,
                children: o.isPending ? "Сохраняем..." : "Добавить"
            })]
        }), o.isError && p.jsx("p", {className: "form-error", children: on(o.error)}), p.jsx(Qn, {
            loading: u.isLoading,
            error: u.error,
            retry: () => u.refetch(),
            empty: "Филиалов пока нет.",
            children: u.data?.map(d => p.jsxs("tr", {
                children: [p.jsxs("td", {children: [p.jsx("b", {children: d.name}), p.jsx("small", {children: d.address ?? "Адрес не указан"})]}), p.jsx("td", {children: d.phone ?? "Не указан"}), p.jsx("td", {children: d.timezone ?? "Не указан"}), p.jsx("td", {
                    children: p.jsx("button", {
                        className: "danger",
                        disabled: f.isPending,
                        onClick: () => confirm(`Удалить филиал "${d.name}"?`) && f.mutate(d.id),
                        children: "Удалить"
                    })
                })]
            }, d.id))
        })]
    })
}

function iv() {
    const n = Dr(), [i, r] = D.useState(""), u = Qa(),
        o = xt({queryKey: [...Pe.clients(n.id), i], queryFn: () => ce.clients(n.id, i)}), f = zn({resolver: On(NT)}),
        d = kt({
            mutationFn: m => ce.createClient({organization_id: n.id, status: "active", ...Og(m)}),
            onSuccess: async () => {
                f.reset(), await u.invalidateQueries({queryKey: Pe.clients(n.id)})
            }
        });
    return p.jsxs("section", {
        className: "panel",
        children: [p.jsx("h2", {children: "Клиенты"}), p.jsxs("form", {
            className: "inline-form",
            onSubmit: f.handleSubmit(m => d.mutate(m)),
            children: [p.jsx(se, {
                label: "Имя",
                children: p.jsx("input", {...f.register("first_name")})
            }), p.jsx(se, {
                label: "Фамилия",
                children: p.jsx("input", {...f.register("last_name")})
            }), p.jsx(se, {
                label: "Телефон",
                children: p.jsx("input", {...f.register("primary_phone")})
            }), p.jsx(se, {
                label: "Email",
                error: f.formState.errors.email?.message,
                children: p.jsx("input", {...f.register("email")})
            }), p.jsx("button", {
                className: "primary",
                disabled: d.isPending,
                children: d.isPending ? "Сохраняем..." : "Добавить клиента"
            })]
        }), d.isError && p.jsx("p", {
            className: "form-error",
            children: on(d.error)
        }), p.jsx("input", {
            className: "search",
            placeholder: "Поиск по имени, телефону или email",
            value: i,
            onChange: m => r(m.target.value)
        }), p.jsx(Qn, {
            loading: o.isLoading,
            error: o.error,
            retry: () => o.refetch(),
            empty: "Клиентов пока нет.",
            children: o.data?.map(m => p.jsxs("tr", {children: [p.jsxs("td", {children: [p.jsx("b", {children: Tg(m)}), p.jsx("small", {children: XT(m.status)})]}), p.jsx("td", {children: m.primary_phone ?? "Не указан"}), p.jsx("td", {children: m.email ?? "Не указан"}), p.jsx("td", {children: new Date(m.created_at).toLocaleDateString("ru-RU")})]}, m.id))
        })]
    })
}

function Va() {
    const n = Dr(), i = Qa(), r = window.location.pathname.split("/").pop() ?? "rules",
        u = lv.some(([z]) => z === r) ? r : "rules", [o, f] = D.useState(""), [d, m] = D.useState(null), [y, v] = D.useState(""), [b, S] = D.useState("accrual"), [T, R] = D.useState({
            target_type: "",
            target_id: "",
            client_level: "",
            level_params: "",
            usage_restrictions: ""
        }), [q, V] = D.useState({service_restrictions: "", family_client_ids: ""}), [U, J] = D.useState({
            package_offer: "",
            weak_hours: "",
            valid_from: "",
            valid_until: "",
            client_segment: ""
        }), [G, W] = D.useState(""), Y = d?.id ?? null, te = new Date().toISOString().slice(0, 16),
        Te = xt({queryKey: [...Pe.clients(n.id), o], queryFn: () => ce.clients(n.id, o)}),
        le = xt({queryKey: Pe.rules(n.id), queryFn: () => ce.rules(n.id)}),
        be = xt({queryKey: Pe.bonusLevels(n.id), queryFn: () => ce.bonusLevels(n.id)}),
        qe = xt({queryKey: [...Pe.clientLoyalty(n.id, Y), "balance"], queryFn: () => ce.bonusBalance(Y), enabled: !!Y}),
        Le = xt({queryKey: [...Pe.clientLoyalty(n.id, Y), "history"], queryFn: () => ce.bonusHistory(Y), enabled: !!Y}),
        Ie = xt({
            queryKey: [...Pe.clientLoyalty(n.id, Y), "subscriptions"],
            queryFn: () => ce.subscriptions(Y),
            enabled: !!Y
        }), fe = xt({
            queryKey: [...Pe.clientLoyalty(n.id, Y), "certificates"],
            queryFn: () => ce.certificates(Y),
            enabled: !!Y
        }), de = xt({
            queryKey: [...Pe.clientLoyalty(n.id, Y), "referrals"],
            queryFn: () => ce.referralStats(Y),
            enabled: !!Y
        }), je = xt({
            queryKey: [...Pe.clientLoyalty(n.id, Y), "referral-list"],
            queryFn: () => ce.referrals(Y),
            enabled: !!Y
        }), ge = xt({
            queryKey: [...Pe.clientLoyalty(n.id, Y), "promotions"],
            queryFn: () => ce.promotions(Y),
            enabled: !!Y
        }), Z = zn({resolver: On(CT), defaultValues: {rule_type: "service", bonus_type: "cashback", expires_in_days: ""}}),
        K = zn({resolver: On(MT)}),
        ue = zn({resolver: On(DT), defaultValues: {client_id: 1, bonus_type: "cashback", reason: ""}}),
        xe = zn({resolver: On(UT), defaultValues: {client_id: 1, auto_renewal_enabled: !1}}),
        Ae = zn({resolver: On(ZT), defaultValues: {client_id: 1, certificate_type: "digital"}}), x = zn({
            resolver: On(LT),
            defaultValues: {referrer_client_id: 1, reward_type: "bonus", reward_bonus_type: "cashback"}
        }), k = zn({
            resolver: On(qT),
            defaultValues: {
                client_id: 1,
                promotion_type: "promo_code",
                discount_type: "percent",
                discount_value: 0,
                min_amount: 0
            }
        }), I = async () => i.invalidateQueries({queryKey: Pe.clientLoyalty(n.id, Y)}), F = kt({
            mutationFn: z => z(), onSuccess: async z => {
                W(z && typeof z == "object" && "profit_amount" in z ? `Прибыль: ${ha(z.profit_amount)}` : ""), await I()
            }
        }), ye = kt({
            mutationFn: z => ce.createRule({
                organization_id: n.id,
                name: z.name,
                rule_type: z.rule_type,
                bonus_type: z.bonus_type,
                amount: Number(z.amount),
                expires_in_days: z.expires_in_days === "" ? void 0 : Number(z.expires_in_days),
                is_active: !0,
                target_type: T.target_type || void 0,
                target_id: T.target_id ? Number(T.target_id) : void 0,
                client_level: T.client_level || void 0,
                level_params: gr(T.level_params),
                usage_restrictions: gr(T.usage_restrictions)
            }), onSuccess: async z => {
                Y && await ce.applyRule(z.id, Y, n.id), Z.reset({
                    rule_type: "service",
                    bonus_type: "cashback",
                    expires_in_days: ""
                }), R({
                    target_type: "",
                    target_id: "",
                    client_level: "",
                    level_params: "",
                    usage_restrictions: ""
                }), await i.invalidateQueries({queryKey: Pe.rules(n.id)}), await I()
            }
        }), _e = kt({mutationFn: z => ce.applyRule(z, Y, n.id), onSuccess: I}), Re = kt({
            mutationFn: z => ce.createBonusLevel({
                organization_id: n.id,
                name: z.name,
                params: y ? JSON.parse(y) : void 0
            }), onSuccess: async () => {
                K.reset(), v(""), await i.invalidateQueries({queryKey: Pe.bonusLevels(n.id)})
            }
        }), lt = kt({
            mutationFn: z => b === "write_off" ? ce.writeOffBonus({
                client_id: Y,
                bonus_type: z.bonus_type,
                amount: Number(z.amount),
                reason: z.reason
            }) : b === "expiration" ? ce.expireBonus({
                client_id: Y,
                bonus_type: z.bonus_type,
                amount: Number(z.amount),
                reason: z.reason
            }) : ce.accrueBonus({
                client_id: Y,
                bonus_type: z.bonus_type,
                amount: Number(z.amount),
                reason: z.reason,
                expires_at: z.expires_at || void 0
            }), onSuccess: async () => {
                ue.reset({client_id: 1, bonus_type: "cashback", reason: ""}), S("accrual"), await I()
            }
        }), He = kt({
            mutationFn: z => ce.createSubscription({
                ...z,
                client_id: Y,
                visits_total: Number(z.visits_total),
                visits_left: Number(z.visits_total),
                deposit_amount: Number(z.deposit_amount || 0),
                deposit_left: Number(z.deposit_amount || 0),
                started_at: te,
                expires_at: z.expires_at || void 0,
                auto_renewal_enabled: !!z.auto_renewal_enabled,
                service_restrictions: gr(q.service_restrictions),
                family_client_ids: KT(q.family_client_ids)
            }), onSuccess: async () => {
                xe.reset({client_id: 1, auto_renewal_enabled: !1}), V({
                    service_restrictions: "",
                    family_client_ids: ""
                }), await I()
            }
        }), dn = kt({
            mutationFn: z => ce.createCertificate({
                ...z,
                client_id: Y,
                nominal_amount: Number(z.nominal_amount),
                balance_amount: Number(z.nominal_amount),
                issued_at: te,
                expires_at: z.expires_at || void 0
            }), onSuccess: async () => {
                Ae.reset({client_id: 1, certificate_type: "digital"}), await I()
            }
        }), hn = kt({
            mutationFn: z => ce.createReferralSource({
                ...z,
                referrer_client_id: Y,
                reward_amount: Number(z.reward_amount),
                reward_bonus_type: z.reward_bonus_type || void 0,
                is_active: !0
            }), onSuccess: async () => {
                x.reset({referrer_client_id: 1, reward_type: "bonus", reward_bonus_type: "cashback"}), await I()
            }
        }), Ln = kt({
            mutationFn: z => ce.createPromotion({
                ...z,
                client_id: Y,
                discount_value: Number(z.discount_value || 0),
                min_amount: Number(z.min_amount || 0),
                usage_limit: z.usage_limit === "" ? void 0 : z.usage_limit,
                promo_code: z.promo_code || void 0,
                gift: z.gift || void 0,
                package_offer: gr(U.package_offer),
                weak_hours: gr(U.weak_hours),
                valid_from: U.valid_from || void 0,
                valid_until: U.valid_until || void 0,
                client_segment: U.client_segment || void 0
            }), onSuccess: async () => {
                k.reset({
                    client_id: 1,
                    promotion_type: "promo_code",
                    discount_type: "percent",
                    discount_value: 0,
                    min_amount: 0
                }), J({package_offer: "", weak_hours: "", valid_from: "", valid_until: "", client_segment: ""}), await I()
            }
        });
    return p.jsxs("section", {
        className: "panel",
        children: [p.jsx("h2", {children: "Лояльность"}), p.jsx("nav", {
            className: "tabs",
            children: lv.map(([z, st]) => p.jsx(Rr, {
                className: u === z ? "active" : "",
                to: `/organizations/${n.id}/loyalty/${z}`,
                children: st
            }, z))
        }), p.jsxs("div", {
            className: "subpanel",
            children: [p.jsx("h3", {children: "Клиент"}), p.jsx("input", {
                className: "search",
                placeholder: "ID, телефон, Telegram, MAX, VK или имя",
                value: o,
                onChange: z => f(z.target.value)
            }), p.jsx(Qn, {
                loading: Te.isLoading,
                error: Te.error,
                retry: () => Te.refetch(),
                empty: "Клиенты не найдены.",
                children: Te.data?.slice(0, 8).map(z => p.jsxs("tr", {
                    children: [p.jsxs("td", {children: [p.jsx("b", {children: Tg(z)}), p.jsxs("small", {children: ["ID ", z.id]})]}), p.jsx("td", {children: z.primary_phone ?? z.email ?? "Контакты не указаны"}), p.jsx("td", {
                        children: p.jsx("button", {
                            className: Y === z.id ? "primary" : "ghost",
                            onClick: () => m(z),
                            children: Y === z.id ? "Выбран" : "Выбрать"
                        })
                    })]
                }, z.id))
            })]
        }), F.isError && p.jsx("p", {className: "form-error", children: on(F.error)}), u === "rules" && p.jsxs("div", {
            className: "subpanel", children: [p.jsx("h3", {children: "Правила начисления"}), p.jsxs("form", {
                className: "inline-form compact",
                onSubmit: Z.handleSubmit(z => ye.mutate(z)),
                children: [p.jsx(se, {
                    label: "Название",
                    error: Z.formState.errors.name?.message,
                    children: p.jsx("input", {...Z.register("name")})
                }), p.jsx(se, {
                    label: "Тип",
                    children: p.jsx("select", {
                        ...Z.register("rule_type"),
                        children: Object.entries(uv).map(([z, st]) => p.jsx("option", {value: z, children: st}, z))
                    })
                }), p.jsx(se, {
                    label: "Бонус",
                    children: p.jsx("input", {...Z.register("bonus_type")})
                }), p.jsx(se, {
                    label: "Сумма",
                    children: p.jsx("input", {type: "number", ...Z.register("amount", {valueAsNumber: !0})})
                }), p.jsx(se, {
                    label: "Срок, дней",
                    children: p.jsx("input", {type: "number", ...Z.register("expires_in_days", {valueAsNumber: !0})})
                }), p.jsx(se, {
                    label: "Цель",
                    children: p.jsx("input", {
                        placeholder: "service/product",
                        value: T.target_type,
                        onChange: z => R({...T, target_type: z.target.value})
                    })
                }), p.jsx(se, {
                    label: "ID цели",
                    children: p.jsx("input", {
                        type: "number",
                        value: T.target_id,
                        onChange: z => R({...T, target_id: z.target.value})
                    })
                }), p.jsx(se, {
                    label: "Уровень",
                    children: p.jsx("input", {
                        value: T.client_level,
                        onChange: z => R({...T, client_level: z.target.value})
                    })
                }), p.jsx(se, {
                    label: "Параметры JSON",
                    children: p.jsx("input", {
                        placeholder: '{"cashback":7}',
                        value: T.level_params,
                        onChange: z => R({...T, level_params: z.target.value})
                    })
                }), p.jsx(se, {
                    label: "Ограничения JSON",
                    children: p.jsx("input", {
                        placeholder: '{"allowed_target_types":["service"]}',
                        value: T.usage_restrictions,
                        onChange: z => R({...T, usage_restrictions: z.target.value})
                    })
                }), p.jsx("button", {
                    className: "primary",
                    disabled: ye.isPending,
                    children: Y ? "Создать и начислить" : "Создать"
                })]
            }), (ye.isError || _e.isError) && p.jsx("p", {
                className: "form-error",
                children: on(ye.error ?? _e.error)
            }), p.jsx(Qn, {
                loading: le.isLoading,
                error: le.error,
                retry: () => le.refetch(),
                empty: "Правил пока нет.",
                children: le.data?.map(z => p.jsxs("tr", {
                    children: [p.jsxs("td", {children: [p.jsx("b", {children: z.name}), p.jsx("small", {children: uv[z.rule_type]})]}), p.jsx("td", {children: z.bonus_type}), p.jsx("td", {children: z.amount}), p.jsx("td", {children: z.expires_in_days ? `${z.expires_in_days} дней` : "Без срока"}), p.jsx("td", {
                        children: p.jsx("button", {
                            className: "ghost",
                            disabled: !Y || _e.isPending,
                            onClick: () => _e.mutate(z.id),
                            children: "Начислить клиенту"
                        })
                    })]
                }, z.id))
            })]
        }), u === "levels" && p.jsxs("div", {
            className: "subpanel",
            children: [p.jsx("h3", {children: "Уровни клиентов"}), p.jsxs("form", {
                className: "inline-form compact",
                onSubmit: K.handleSubmit(z => Re.mutate(z)),
                children: [p.jsx(se, {
                    label: "Название",
                    children: p.jsx("input", {...K.register("name")})
                }), p.jsx(se, {
                    label: "JSON параметры",
                    children: p.jsx("input", {
                        placeholder: '{"cashback": 7}',
                        value: y,
                        onChange: z => v(z.target.value)
                    })
                }), p.jsx("button", {className: "primary", disabled: Re.isPending, children: "Создать"})]
            }), Re.isError && p.jsx("p", {
                className: "form-error",
                children: on(Re.error)
            }), p.jsx(Qn, {
                loading: be.isLoading,
                error: be.error,
                retry: () => be.refetch(),
                empty: "Уровней пока нет.",
                children: be.data?.map(z => p.jsxs("tr", {children: [p.jsx("td", {children: p.jsx("b", {children: z.name})}), p.jsx("td", {children: p.jsx("small", {children: JSON.stringify(z.params ?? {})})})]}, z.id))
            })]
        }), u === "transactions" && p.jsxs("div", {
            className: "subpanel",
            children: [p.jsx("h3", {children: "Бонусы клиента"}), p.jsxs("div", {
                className: "grid loyalty-grid",
                children: [p.jsx(pi, {
                    label: "Баланс",
                    query: {isLoading: qe.isLoading, data: []},
                    value: qe.data?.balance ?? 0
                }), p.jsx(pi, {label: "Операций", query: Le})]
            }), p.jsxs("form", {
                className: "inline-form compact",
                onSubmit: ue.handleSubmit(z => lt.mutate(z)),
                children: [p.jsx(se, {
                    label: "Операция",
                    children: p.jsxs("select", {
                        value: b,
                        onChange: z => S(z.target.value),
                        children: [p.jsx("option", {
                            value: "accrual",
                            children: "Начислить"
                        }), p.jsx("option", {
                            value: "write_off",
                            children: "Списать"
                        }), p.jsx("option", {value: "expiration", children: "Сжечь"})]
                    })
                }), p.jsx(se, {
                    label: "Бонус",
                    children: p.jsx("input", {...ue.register("bonus_type")})
                }), p.jsx(se, {
                    label: "Сумма",
                    children: p.jsx("input", {type: "number", ...ue.register("amount", {valueAsNumber: !0})})
                }), p.jsx(se, {
                    label: "Причина",
                    children: p.jsx("input", {...ue.register("reason")})
                }), p.jsx(se, {
                    label: "Сгорает",
                    children: p.jsx("input", {type: "datetime-local", ...ue.register("expires_at")})
                }), p.jsx("button", {
                    className: "primary",
                    disabled: !Y || lt.isPending,
                    children: "Провести"
                }), p.jsx("button", {
                    type: "button",
                    className: "ghost",
                    disabled: F.isPending,
                    onClick: () => F.mutate(ce.runBonusExpiration),
                    children: "Списать просроченные"
                })]
            }), lt.isError && p.jsx("p", {
                className: "form-error",
                children: on(lt.error)
            }), p.jsx(Qn, {
                loading: Le.isLoading,
                error: Le.error,
                retry: () => Le.refetch(),
                empty: "Истории пока нет.",
                children: Le.data?.map(z => p.jsxs("tr", {children: [p.jsxs("td", {children: [p.jsx("b", {children: JT[z.transaction_type]}), p.jsx("small", {children: z.reason ?? "Без причины"})]}), p.jsx("td", {children: z.bonus_type}), p.jsx("td", {children: z.amount}), p.jsx("td", {children: vr(z.created_at)})]}, z.id))
            })]
        }), u === "subscriptions" && p.jsxs("div", {
            className: "subpanel", children: [p.jsx("h3", {children: "Абонементы"}), p.jsxs("form", {
                className: "inline-form compact",
                onSubmit: xe.handleSubmit(z => He.mutate(z)),
                children: [p.jsx(se, {
                    label: "Название",
                    children: p.jsx("input", {...xe.register("subscription_name")})
                }), p.jsx(se, {
                    label: "Визитов",
                    children: p.jsx("input", {type: "number", ...xe.register("visits_total", {valueAsNumber: !0})})
                }), p.jsx(se, {
                    label: "Депозит",
                    children: p.jsx("input", {
                        type: "number",
                        step: "0.01", ...xe.register("deposit_amount", {valueAsNumber: !0})
                    })
                }), p.jsx(se, {
                    label: "Старт",
                    children: p.jsx("input", {type: "datetime-local", value: te, readOnly: !0})
                }), p.jsx(se, {
                    label: "До",
                    children: p.jsx("input", {type: "datetime-local", ...xe.register("expires_at")})
                }), p.jsx(se, {
                    label: "Услуги JSON",
                    children: p.jsx("input", {
                        placeholder: '{"service_ids":[1,2]}',
                        value: q.service_restrictions,
                        onChange: z => V({...q, service_restrictions: z.target.value})
                    })
                }), p.jsx(se, {
                    label: "Семья ID",
                    children: p.jsx("input", {
                        placeholder: "2,3",
                        value: q.family_client_ids,
                        onChange: z => V({...q, family_client_ids: z.target.value})
                    })
                }), p.jsx(se, {
                    label: "Автопродление",
                    children: p.jsx("input", {type: "checkbox", ...xe.register("auto_renewal_enabled")})
                }), p.jsx("button", {className: "primary", disabled: !Y || He.isPending, children: "Выдать"})]
            }), He.isError && p.jsx("p", {className: "form-error", children: on(He.error)}), p.jsx(Qn, {
                loading: Ie.isLoading,
                error: Ie.error,
                retry: () => Ie.refetch(),
                empty: "Абонементов пока нет.",
                children: Ie.data?.map(z => p.jsxs("tr", {
                    children: [p.jsxs("td", {children: [p.jsx("b", {children: z.subscription_name}), p.jsxs("small", {children: [z.status, z.is_frozen ? ", заморожен" : ""]})]}), p.jsxs("td", {children: [z.visits_left, "/", z.visits_total, " визитов", p.jsxs("small", {children: ["семья: ", z.family_client_ids?.join(", ") || "-"]})]}), p.jsxs("td", {children: [ha(z.deposit_left), "/", ha(z.deposit_amount)]}), p.jsxs("td", {children: [vr(z.expires_at), p.jsx("small", {children: z.auto_renewal_enabled ? "авто" : "без авто"})]}), p.jsxs("td", {
                        className: "actions",
                        children: [p.jsx("button", {
                            className: "ghost",
                            onClick: () => F.mutate(() => ce.freezeSubscription(z.id, {
                                frozen_from: new Date().toISOString(),
                                frozen_until: jg("Заморозить до")
                            })),
                            children: "Freeze"
                        }), p.jsx("button", {
                            className: "ghost",
                            onClick: () => F.mutate(() => ce.unfreezeSubscription(z.id)),
                            children: "Unfreeze"
                        }), p.jsx("button", {
                            className: "ghost",
                            onClick: () => Iu(F, "Кому передать ID", st => ce.transferSubscription(z.id, st)),
                            children: "Transfer"
                        }), p.jsx("button", {
                            className: "ghost",
                            onClick: () => Iu(F, "ID члена семьи", st => ce.addFamilyClient(z.id, st)),
                            children: "Family"
                        }), p.jsx("button", {
                            className: "ghost",
                            onClick: () => F.mutate(() => ce.setAutoRenewal(z.id, !z.auto_renewal_enabled)),
                            children: "Auto"
                        }), p.jsx("button", {
                            className: "ghost",
                            onClick: () => PT(F, z.id),
                            children: "Visit"
                        }), p.jsx("button", {
                            className: "ghost",
                            onClick: () => IT(F, z.id),
                            children: "Renew"
                        }), p.jsx("button", {
                            className: "danger",
                            onClick: () => F.mutate(() => ce.expireSubscription(z.id)),
                            children: "Expire"
                        })]
                    })]
                }, z.id))
            })]
        }), u === "certificates" && p.jsxs("div", {
            className: "subpanel",
            children: [p.jsx("h3", {children: "Сертификаты"}), p.jsxs("form", {
                className: "inline-form compact",
                onSubmit: Ae.handleSubmit(z => dn.mutate(z)),
                children: [p.jsx(se, {
                    label: "Тип",
                    children: p.jsxs("select", {
                        ...Ae.register("certificate_type"),
                        children: [p.jsx("option", {
                            value: "digital",
                            children: "Электронный"
                        }), p.jsx("option", {value: "paper", children: "Бумажный"})]
                    })
                }), p.jsx(se, {
                    label: "Код",
                    children: p.jsx("input", {...Ae.register("certificate_code")})
                }), p.jsx(se, {
                    label: "Номинал",
                    children: p.jsx("input", {
                        type: "number",
                        step: "0.01", ...Ae.register("nominal_amount", {valueAsNumber: !0})
                    })
                }), p.jsx(se, {
                    label: "Выдан",
                    children: p.jsx("input", {type: "datetime-local", value: te, readOnly: !0})
                }), p.jsx(se, {
                    label: "До",
                    children: p.jsx("input", {type: "datetime-local", ...Ae.register("expires_at")})
                }), p.jsx("button", {className: "primary", disabled: !Y || dn.isPending, children: "Выдать"})]
            }), dn.isError && p.jsx("p", {className: "form-error", children: on(dn.error)}), p.jsx(Qn, {
                loading: fe.isLoading,
                error: fe.error,
                retry: () => fe.refetch(),
                empty: "Сертификатов пока нет.",
                children: fe.data?.map(z => p.jsxs("tr", {
                    children: [p.jsxs("td", {children: [p.jsx("b", {children: z.certificate_code}), p.jsx("small", {children: z.certificate_type})]}), p.jsxs("td", {children: [ha(z.balance_amount), " / ", ha(z.nominal_amount), p.jsxs("small", {children: ["депозит: ", ha(z.deposit_converted_amount)]})]}), p.jsx("td", {children: z.status}), p.jsx("td", {children: vr(z.expires_at)}), p.jsxs("td", {
                        className: "actions",
                        children: [p.jsx("button", {
                            className: "ghost",
                            onClick: () => Iu(F, "Сумма использования", st => ce.useCertificate(z.id, {
                                amount: st,
                                convert_rest_to_deposit: window.confirm("Остаток в депозит?")
                            })),
                            children: "Use"
                        }), p.jsx("button", {
                            className: "ghost",
                            onClick: () => F.mutate(() => ce.convertCertificateToDeposit(z.id)),
                            children: "Deposit"
                        }), p.jsx("button", {
                            className: "ghost",
                            onClick: () => Iu(F, "Кому передать ID", st => ce.transferCertificate(z.id, st)),
                            children: "Transfer"
                        }), p.jsx("button", {
                            className: "danger",
                            onClick: () => F.mutate(() => ce.refundCertificate(z.id)),
                            children: "Refund"
                        }), p.jsx("button", {
                            className: "danger",
                            onClick: () => F.mutate(() => ce.expireCertificate(z.id)),
                            children: "Expire"
                        })]
                    })]
                }, z.id))
            })]
        }), u === "referrals" && p.jsxs("div", {
            className: "subpanel",
            children: [p.jsx("h3", {children: "Реферальная программа"}), p.jsxs("div", {
                className: "grid loyalty-grid",
                children: [p.jsx(pi, {
                    label: "Рефералов",
                    query: {isLoading: de.isLoading, data: []},
                    value: de.data?.invites_count ?? 0
                }), p.jsx(pi, {
                    label: "Успешных",
                    query: {isLoading: de.isLoading, data: []},
                    value: de.data?.successful_invites_count ?? 0
                })]
            }), p.jsxs("form", {
                className: "inline-form compact",
                onSubmit: x.handleSubmit(z => hn.mutate(z)),
                children: [p.jsx(se, {
                    label: "Код",
                    children: p.jsx("input", {...x.register("referral_code")})
                }), p.jsx(se, {
                    label: "Ссылка",
                    children: p.jsx("input", {...x.register("referral_link")})
                }), p.jsx(se, {
                    label: "Тип награды",
                    children: p.jsxs("select", {
                        ...x.register("reward_type"),
                        children: [p.jsx("option", {
                            value: "bonus",
                            children: "Бонус"
                        }), p.jsx("option", {value: "money", children: "Деньги"})]
                    })
                }), p.jsx(se, {
                    label: "Бонус",
                    children: p.jsx("input", {...x.register("reward_bonus_type")})
                }), p.jsx(se, {
                    label: "Сумма",
                    children: p.jsx("input", {
                        type: "number",
                        step: "0.01", ...x.register("reward_amount", {valueAsNumber: !0})
                    })
                }), p.jsx("button", {className: "primary", disabled: !Y || hn.isPending, children: "Создать"})]
            }), hn.isError && p.jsx("p", {
                className: "form-error",
                children: on(hn.error)
            }), p.jsxs("div", {
                className: "actions",
                children: [p.jsx("button", {
                    className: "ghost",
                    disabled: !Y,
                    onClick: () => rv(F, "code"),
                    children: "Определить по коду"
                }), p.jsx("button", {
                    className: "ghost",
                    disabled: !Y,
                    onClick: () => rv(F, "link"),
                    children: "Определить по ссылке"
                })]
            }), p.jsx(Qn, {
                loading: je.isLoading,
                error: je.error,
                retry: () => je.refetch(),
                empty: "Приглашений пока нет.",
                children: je.data?.map(z => p.jsxs("tr", {
                    children: [p.jsxs("td", {children: [p.jsxs("b", {children: ["ID ", z.id]}), p.jsxs("small", {children: ["приглашён: ", z.invited_client_id ?? "-"]})]}), p.jsxs("td", {children: [z.reward_type, " ", ha(z.reward_amount)]}), p.jsxs("td", {children: [z.reward_status, p.jsx("small", {children: z.first_visit_at ? vr(z.first_visit_at) : "первого визита нет"})]}), p.jsxs("td", {
                        className: "actions",
                        children: [p.jsx("button", {
                            className: "ghost",
                            onClick: () => F.mutate(() => ce.markReferralFirstVisit(z.id, hl("ID первого визита") || String(Date.now()))),
                            children: "First visit"
                        }), p.jsx("button", {
                            className: "ghost",
                            onClick: () => F.mutate(() => ce.accrueReferralReward(z.id)),
                            children: "Reward"
                        }), p.jsx("button", {
                            className: "danger",
                            onClick: () => F.mutate(() => ce.cancelReferralReward(z.id, hl("Причина отмены") || void 0)),
                            children: "Cancel"
                        })]
                    })]
                }, z.id))
            })]
        }), u === "promotions" && p.jsxs("div", {
            className: "subpanel", children: [p.jsx("h3", {children: "Акции и промокоды"}), p.jsxs("form", {
                className: "inline-form compact",
                onSubmit: k.handleSubmit(z => Ln.mutate(z)),
                children: [p.jsx(se, {
                    label: "Название",
                    children: p.jsx("input", {...k.register("promotion_name")})
                }), p.jsx(se, {
                    label: "Код",
                    children: p.jsx("input", {...k.register("promo_code")})
                }), p.jsx(se, {
                    label: "Тип",
                    children: p.jsxs("select", {
                        ...k.register("promotion_type"),
                        children: [p.jsx("option", {
                            value: "promo_code",
                            children: "Промокод"
                        }), p.jsx("option", {value: "discount", children: "Скидка"}), p.jsx("option", {
                            value: "gift",
                            children: "Подарок"
                        }), p.jsx("option", {
                            value: "package",
                            children: "Пакет"
                        }), p.jsx("option", {value: "weak_hours", children: "Слабые часы"})]
                    })
                }), p.jsx(se, {
                    label: "Скидка",
                    children: p.jsxs("select", {
                        ...k.register("discount_type"),
                        children: [p.jsx("option", {value: "percent", children: "%"}), p.jsx("option", {
                            value: "fixed",
                            children: "Фикс"
                        })]
                    })
                }), p.jsx(se, {
                    label: "Размер",
                    children: p.jsx("input", {
                        type: "number",
                        step: "0.01", ...k.register("discount_value", {valueAsNumber: !0})
                    })
                }), p.jsx(se, {
                    label: "Мин. сумма",
                    children: p.jsx("input", {
                        type: "number",
                        step: "0.01", ...k.register("min_amount", {valueAsNumber: !0})
                    })
                }), p.jsx(se, {
                    label: "Подарок",
                    children: p.jsx("input", {...k.register("gift")})
                }), p.jsx(se, {
                    label: "Лимит",
                    children: p.jsx("input", {type: "number", ...k.register("usage_limit", {valueAsNumber: !0})})
                }), p.jsx(se, {
                    label: "Сегмент",
                    children: p.jsx("input", {
                        value: U.client_segment,
                        onChange: z => J({...U, client_segment: z.target.value})
                    })
                }), p.jsx(se, {
                    label: "С",
                    children: p.jsx("input", {
                        type: "datetime-local",
                        value: U.valid_from,
                        onChange: z => J({...U, valid_from: z.target.value})
                    })
                }), p.jsx(se, {
                    label: "До",
                    children: p.jsx("input", {
                        type: "datetime-local",
                        value: U.valid_until,
                        onChange: z => J({...U, valid_until: z.target.value})
                    })
                }), p.jsx(se, {
                    label: "Пакет JSON",
                    children: p.jsx("input", {
                        placeholder: '{"services":[1,2]}',
                        value: U.package_offer,
                        onChange: z => J({...U, package_offer: z.target.value})
                    })
                }), p.jsx(se, {
                    label: "Слабые часы JSON",
                    children: p.jsx("input", {
                        placeholder: '{"days":["mon"],"from":"10:00"}',
                        value: U.weak_hours,
                        onChange: z => J({...U, weak_hours: z.target.value})
                    })
                }), p.jsx("button", {className: "primary", disabled: !Y || Ln.isPending, children: "Создать"})]
            }), Ln.isError && p.jsx("p", {
                className: "form-error",
                children: on(Ln.error)
            }), G && p.jsx("p", {className: "empty", children: G}), p.jsx(Qn, {
                loading: ge.isLoading,
                error: ge.error,
                retry: () => ge.refetch(),
                empty: "Акций пока нет.",
                children: ge.data?.map(z => p.jsxs("tr", {
                    children: [p.jsxs("td", {children: [p.jsx("b", {children: z.promotion_name}), p.jsx("small", {children: z.promo_code ?? "Без кода"})]}), p.jsxs("td", {children: [z.promotion_type, p.jsx("small", {children: z.client_segment ?? "любой сегмент"})]}), p.jsxs("td", {children: [z.discount_type ?? "-", " ", ha(z.discount_value), p.jsxs("small", {children: [z.used_count, "/", z.usage_limit ?? "∞"]})]}), p.jsxs("td", {children: [ha(z.min_amount), p.jsx("small", {children: vr(z.valid_until)})]}), p.jsxs("td", {
                        className: "actions",
                        children: [p.jsx("button", {
                            className: "ghost",
                            onClick: () => WT(F, z.id),
                            children: "Apply"
                        }), p.jsx("button", {
                            className: "ghost",
                            onClick: () => ej(F, z.id),
                            children: "Profit"
                        }), z.promo_code && p.jsx("button", {
                            className: "ghost",
                            disabled: !Y,
                            onClick: () => tj(F, z.promo_code, Y),
                            children: "By code"
                        })]
                    })]
                }, z.id))
            })]
        })]
    })
}

function YT() {
    const n = Dr();
    return p.jsxs("section", {
        className: "panel",
        children: [p.jsx("h2", {children: n.name}), p.jsx("p", {children: "Настройки оранизации организации пока берутся из backend поля settings."})]
    })
}

function Dr() {
    const {organizationId: n = ""} = Dv(),
        r = xt({queryKey: Pe.orgs, queryFn: ce.organizations}).data?.find(u => u.id === Number(n));
    if (!r) throw new Error("Организация не найдена");
    return r
}

function se({label: n, error: i, children: r}) {
    return p.jsxs("label", {
        children: [p.jsx("span", {children: n}), r, i && p.jsx("small", {
            className: "field-error",
            children: i
        })]
    })
}

function Qn({loading: n, error: i, retry: r, empty: u, children: o}) {
    return n ? p.jsx("div", {className: "skeleton", children: "Загрузка..."}) : i ? p.jsx(Yf, {
        error: i,
        retry: r
    }) : !o || Array.isArray(o) && o.length === 0 ? p.jsx("p", {
        className: "empty",
        children: u
    }) : p.jsx("div", {className: "table-wrap", children: p.jsx("table", {children: p.jsx("tbody", {children: o})})})
}

function pi({label: n, query: i, value: r}) {
    return p.jsxs("div", {
        className: "metric",
        children: [p.jsx("span", {children: n}), p.jsx("b", {children: i.isLoading ? "..." : r ?? i.data?.length ?? 0})]
    })
}

function Yf({error: n, retry: i}) {
    return p.jsxs("div", {
        className: "empty",
        children: [p.jsx("p", {children: on(n)}), p.jsx("button", {
            className: "ghost",
            onClick: i,
            children: "Повторить"
        })]
    })
}

function GT() {
    return p.jsx(Mr, {text: "Организация не найдена или у вас больше нет к ней доступа"})
}

function FT() {
    return p.jsx(Mr, {text: "Страница не найдена"})
}

function Mr({text: n}) {
    return p.jsx("main", {
        className: "auth-page",
        children: p.jsx("div", {className: "auth-card", children: p.jsx("p", {children: n})})
    })
}

function yr({to: n, label: i}) {
    return p.jsx(Rr, {to: n, children: i})
}

function on(n) {
    return n instanceof _g || n instanceof Error ? n.message : "Не удалось выполнить действие"
}

function Og(n) {
    return Object.fromEntries(Object.entries(n).filter(([, i]) => i !== "" && i !== void 0))
}

function Tg(n) {
    return n.full_name || [n.first_name, n.last_name].filter(Boolean).join(" ") || "Без имени"
}

function XT(n) {
    return n === "active" ? "Активен" : n === "archived" ? "В архиве" : "Статус не указан"
}

const lv = [["rules", "Правила"], ["levels", "Уровни"], ["transactions", "Бонусы"], ["subscriptions", "Абонементы"], ["certificates", "Сертификаты"], ["referrals", "Рефералы"], ["promotions", "Акции"]],
    JT = {accrual: "Начисление", write_off: "Списание", expiration: "Сгорание"};

function vr(n) {
    return n ? new Date(n).toLocaleDateString("ru-RU") : "Без срока"
}

function ha(n) {
    return Number(n ?? 0).toLocaleString("ru-RU", {maximumFractionDigits: 2})
}

function gr(n) {
    return n.trim() ? JSON.parse(n) : void 0
}

function KT(n) {
    const i = n.split(",").map(r => Number(r.trim())).filter(Boolean);
    return i.length ? i : void 0
}

function hl(n) {
    return window.prompt(n)?.trim() || ""
}

function jg(n) {
    return hl(`${n} (YYYY-MM-DDTHH:mm)`) || void 0
}

function ma(n) {
    const i = Number(hl(n));
    return Number.isFinite(i) && i > 0 ? i : null
}

function Iu(n, i, r) {
    const u = ma(i);
    u !== null && n.mutate(() => r(u))
}

function PT(n, i) {
    const r = ma("ID визита");
    if (r === null) return;
    const u = ma("Списать визитов") ?? 0, o = ma("Списать депозит") ?? 0;
    n.mutate(() => ce.writeOffSubscriptionVisit(i, {visit_id: r, visits_count: u, deposit_amount: o}))
}

function IT(n, i) {
    const r = ma("Новые визиты") ?? 0, u = ma("Новый депозит") ?? 0;
    n.mutate(() => ce.renewSubscription(i, {
        visits_total: r,
        deposit_amount: u,
        started_at: new Date().toISOString(),
        expires_at: jg("Продлить до")
    }))
}

function rv(n, i) {
    const r = ma("ID приглашённого клиента"), u = hl(i === "code" ? "Реферальный код" : "Реферальная ссылка");
    r === null || !u || n.mutate(() => i === "code" ? ce.registerReferralByCode({
        referral_code: u,
        invited_client_id: r
    }) : ce.registerReferralByLink({referral_link: u, invited_client_id: r}))
}

function Gf() {
    const n = ma("Сумма продажи"), i = ma("Себестоимость");
    return n === null || i === null ? null : {
        original_amount: n,
        cost_amount: i,
        client_segment: hl("Сегмент клиента") || void 0
    }
}

function WT(n, i) {
    const r = Gf();
    r && n.mutate(() => ce.applyPromotion(i, r))
}

function ej(n, i) {
    const r = Gf();
    r && n.mutate(() => ce.promotionProfitability(i, r))
}

function tj(n, i, r) {
    const u = Gf();
    u && n.mutate(() => ce.applyPromotionByCode({...u, promo_code: i, client_id: r}))
}

const uv = {
    welcome: "Приветственные бонусы",
    birthday: "День рождения",
    referral: "Реферальная программа",
    service: "Услуга",
    product: "Товар"
}, nj = new p_({defaultOptions: {queries: {retry: 1, refetchOnWindowFocus: !1}}});
U_.createRoot(document.getElementById("root")).render(p.jsx(D.StrictMode, {
    children: p.jsx(v_, {
        client: nj,
        children: p.jsx(u1, {children: p.jsx(BT, {})})
    })
}));
