import { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import * as THREE from 'three';
import { gsap } from 'gsap';

export default function LoginPage({ onLogin }) {
  const [mode, setMode]       = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]  = useState('');
  const [loading, setLoading]  = useState(false);
  const [error, setError]      = useState('');

  const canvasRef  = useRef(null);
  const cardRef    = useRef(null);
  const overlayRef = useRef(null);
  const sceneRef   = useRef({});
  const rafRef     = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  // ── Three.js glass orb ───────────────────────────────────────
  useEffect(() => {
    const container = canvasRef.current;
    if (!container || prefersReducedMotion) return;

    const W = container.offsetWidth;
    const H = container.offsetHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0x020714);
    const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 200);
    camera.position.set(0, 0, 6);

    // Lights
    scene.add(new THREE.AmbientLight(0x0a1628, 3));
    const blueLight = new THREE.PointLight(0x1a6fff, 60, 30);
    blueLight.position.set(6, 5, 5);
    scene.add(blueLight);
    const violetLight = new THREE.PointLight(0x7c3aed, 40, 25);
    violetLight.position.set(-6, -4, 3);
    scene.add(violetLight);
    const cyanLight = new THREE.PointLight(0x00cfff, 25, 20);
    cyanLight.position.set(0, 0, -6);
    scene.add(cyanLight);

    // Orbital rings (like the screenshot)
    const ringData = [
      { r: 2.4, tube: 0.006, color: 0x3b82f6, opacity: 0.7,  rotX: 0.3,  rotZ: 0.1  },
      { r: 2.8, tube: 0.005, color: 0x8b5cf6, opacity: 0.5,  rotX: -0.5, rotZ: 0.8  },
      { r: 3.2, tube: 0.004, color: 0x06b6d4, opacity: 0.35, rotX: 1.1,  rotZ: -0.4 },
      { r: 3.7, tube: 0.003, color: 0x3b82f6, opacity: 0.2,  rotX: -1.3, rotZ: 0.6  },
    ];
    const rings = ringData.map(({ r, tube, color, opacity, rotX, rotZ }) => {
      const geo = new THREE.TorusGeometry(r, tube, 6, 160);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = rotX;
      mesh.rotation.z = rotZ;
      scene.add(mesh);
      return mesh;
    });

    // Dashboard mini-preview texture inside orb (simple colored planes)
    const previewGroup = new THREE.Group();
    const previewData = [
      { w: 1.2, h: 0.6, x: -0.3, y: 0.3,  z: 0, color: 0x0f2040 },
      { w: 0.5, h: 0.5, x:  0.6, y: 0.3,  z: 0, color: 0x0d1a36 },
      { w: 0.5, h: 0.5, x: -0.7, y: -0.2, z: 0, color: 0x0d1a36 },
      { w: 0.4, h: 0.3, x:  0.5, y: -0.2, z: 0, color: 0x0a1628 },
    ];
    previewData.forEach(({ w, h, x, y, z, color }) => {
      const geo = new THREE.PlaneGeometry(w, h);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      previewGroup.add(mesh);
    });
    // Chart line inside the main preview pane
    const linePoints = [];
    for (let i = 0; i <= 24; i++) {
      linePoints.push(new THREE.Vector3(-0.55 + i * 0.046, 0.25 + Math.sin(i * 0.6) * 0.06 + Math.random() * 0.03, 0.01));
    }
    const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.9 });
    previewGroup.add(new THREE.Line(lineGeo, lineMat));
    scene.add(previewGroup);

    // Glass outer sphere
    const orbGeo = new THREE.SphereGeometry(2.0, 128, 128);
    const orbMat = new THREE.MeshPhysicalMaterial({
      transmission: 0.97,
      thickness: 3.0,
      roughness: 0.03,
      ior: 1.45,
      color: new THREE.Color(0x0d2040),
      transparent: true,
      envMapIntensity: 0.8,
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    scene.add(orb);

    // Energy core — Fresnel glow
    const coreGeo = new THREE.SphereGeometry(0.7, 64, 64);
    const coreMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec3 vNormal; varying vec3 vView;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vView = -mv.xyz;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vNormal; varying vec3 vView;
        void main() {
          float f = pow(1.0 - max(dot(normalize(vView), vNormal), 0.0), 2.0);
          float p = 0.5 + 0.5 * sin(uTime * 2.1);
          vec3 c = mix(vec3(0.1, 0.4, 1.0), vec3(0.55, 0.28, 1.0), p);
          gl_FragColor = vec4(c * f * 4.0, f * 0.95);
        }
      `,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    // Outer aura
    const auraGeo = new THREE.SphereGeometry(2.15, 32, 32);
    const auraMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec3 vNormal; varying vec3 vView;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vView = -mv.xyz;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vNormal; varying vec3 vView;
        void main() {
          float f = pow(1.0 - max(dot(normalize(vView), vNormal), 0.0), 5.0);
          float p = 0.5 + 0.5 * sin(uTime * 0.7 + 1.8);
          vec3 c = mix(vec3(0.1, 0.4, 1.0), vec3(0.45, 0.22, 0.9), p);
          gl_FragColor = vec4(c * f * 1.6, f * 0.45);
        }
      `,
      transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    scene.add(new THREE.Mesh(auraGeo, auraMat));

    // Star field
    const starPos = new Float32Array(2000 * 3);
    for (let i = 0; i < 2000 * 3; i++) starPos[i] = (Math.random() - 0.5) * 80;
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x8ba4c8, size: 0.06, transparent: true, opacity: 0.5 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Mouse parallax
    let mx = 0, my = 0;
    const onMouse = e => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouse);

    const onResize = () => {
      const w = container.offsetWidth, h = container.offsetHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let t = 0;
    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      t += 0.014;
      coreMat.uniforms.uTime.value = t;
      auraMat.uniforms.uTime.value = t;

      rings.forEach((r, i) => { r.rotation.y += (0.002 + i * 0.0008); });
      orb.rotation.y = t * 0.04 + mx * 0.05;
      orb.rotation.x = my * 0.04;
      core.rotation.y = t * 0.2;
      previewGroup.rotation.y = orb.rotation.y;
      previewGroup.rotation.x = orb.rotation.x;
      stars.rotation.y = t * 0.008;

      const fl = Math.sin(t * 0.5) * 0.04;
      orb.position.y  = fl;
      core.position.y = fl;

      camera.position.x += (mx * 0.2 - camera.position.x) * 0.04;
      camera.position.y += (-my * 0.15 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    loop();

    sceneRef.current = { camera, renderer };

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [prefersReducedMotion]);

  // ── Warp transition ──────────────────────────────────────────
  const runTransition = userData => {
    if (prefersReducedMotion) { onLogin(userData); return; }
    const { camera } = sceneRef.current;
    const tl = gsap.timeline({ onComplete: () => onLogin(userData) });
    tl.to(cardRef.current, { opacity: 0, y: -16, duration: 0.5, ease: 'power2.in' });
    tl.to(camera.position, { z: 0.3, duration: 1.4, ease: 'expo.inOut' }, '-=0.2');
    tl.to(overlayRef.current, { opacity: 1, duration: 0.35 }, '-=0.35');
  };

  // ── Auth ─────────────────────────────────────────────────────
  const submit = async (user, pass) => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: user, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      runTransition(data.user);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!username.trim()) return setError('Username is required');
    if (!password) return setError('Password is required');
    if (mode === 'signup') {
      if (password.length < 6) return setError('Password must be at least 6 characters');
      if (password !== confirm) return setError('Passwords do not match');
      // signup then auto-login
      setLoading(true); setError('');
      try {
        const res = await fetch('/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username: username.trim(), password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Signup failed');
        runTransition(data.user);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
      return;
    }
    submit(username.trim(), password);
  };

  const signInAsDemo = () => submit('demo', 'demo');
  const switchMode  = m => { setMode(m); setError(''); setPassword(''); setConfirm(''); };

  return (
    <div className="aura-login">
      {/* Three.js canvas */}
      <div ref={canvasRef} className="aura-login__canvas" />

      {/* Warp overlay */}
      <div ref={overlayRef} className="aura-login__overlay" />

      {/* Layout: orb left, card right */}
      <div className="aura-login__layout">

        {/* Left — branding over the orb */}
        <div className="aura-login__hero">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.3, duration: 0.7, ease: 'easeOut' }}
            className="aura-login__hero-text"
          >
            <div className="aura-login__wordmark">Stock Monitor</div>
            <p className="aura-login__tagline">Your portfolio. Live. Intelligent.</p>
          </motion.div>
        </div>

        {/* Right — glass login card */}
        <motion.div
          ref={cardRef}
          className="aura-login__card"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={prefersReducedMotion
            ? { duration: 0.2 }
            : { type: 'spring', stiffness: 100, damping: 18, delay: 0.15 }}
        >
          {/* Tabs */}
          <div className="aura-login__tabs">
            {['login', 'signup'].map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`aura-login__tab${mode === m ? ' aura-login__tab--active' : ''}`}
              >
                {m === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="aura-login__form">
            <div className="aura-login__field">
              <label className="aura-login__label">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus
                autoComplete="username"
                maxLength={40}
                placeholder="your-username"
                className="aura-login__input"
              />
            </div>

            <div className="aura-login__field">
              <label className="aura-login__label">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="aura-login__input"
              />
            </div>

            {mode === 'signup' && (
              <div className="aura-login__field">
                <label className="aura-login__label">Confirm password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  className="aura-login__input"
                />
              </div>
            )}

            {error && <p className="aura-login__error">{error}</p>}

            <button type="submit" disabled={loading} className="aura-login__btn-primary">
              {loading ? (mode === 'signup' ? 'Creating…' : 'Signing in…') : (mode === 'signup' ? 'Create account' : 'Sign in')}
            </button>
          </form>

          <div className="aura-login__divider"><span>or</span></div>

          <button onClick={signInAsDemo} disabled={loading} className="aura-login__btn-demo">
            Sign in as demo
          </button>
          <p className="aura-login__demo-hint">Pre-loaded with 10 holdings · no sign-up required</p>

          <p className="aura-login__footer">
            {mode === 'login' ? 'New here? ' : 'Already have one? '}
            <button onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')} className="aura-login__link">
              {mode === 'login' ? 'Create account →' : 'Sign in'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
