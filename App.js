import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import bcrypt from "bcryptjs";
import "./index.css";

const ADMIN_EMAIL = "akiranazuka21@gmail.com";

const playBeep = (num) => {
  const audio = new Audio(`/sound/beep${num}.mp3`);
  audio.play();
};

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("user");
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isHold, setIsHold] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // auth listener
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (u) {
        setUser(u);
        if (u.email === ADMIN_EMAIL) setRole("admin");
        else setRole("user");
      } else {
        setUser(null);
        setRole("user");
      }
    });
    return () => unsub();
  }, []);

  // load rooms
  useEffect(() => {
    const ref = db.ref("rooms");
    ref.on("value", (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const arr = Object.keys(data).map((id) => ({ id, ...data[id] }));
        setRooms(arr);
      }
    });
    return () => ref.off();
  }, []);

  // dummy online users
  useEffect(() => {
    if (currentRoom) {
      setOnlineUsers([
        { id: "u1", name: "User A" },
        { id: "u2", name: "User B" }
      ]);
    }
  }, [currentRoom]);

  const handleRegister = async () => {
    await auth.createUserWithEmailAndPassword(email, password);
    const uid = auth.currentUser.uid;
    await db.ref(`users/${uid}`).set({ email, role: "user" });
  };

  const handleLogin = async () => {
    await auth.signInWithEmailAndPassword(email, password);
  };

  const handleLogout = async () => {
    await auth.signOut();
  };

  const createPrivateRoom = async () => {
    const name = prompt("Nama Room Private:");
    const pass = prompt("Password untuk Room:");
    if (!name || !pass) return;
    const hash = await bcrypt.hash(pass, 10);
    const ref = db.ref("rooms").push();
    await ref.set({
      name: `★ ${name}`,
      isPrivate: true,
      passwordHash: hash,
      allowedUsers: { [user.uid]: true },
      createdBy: user.uid
    });
    playBeep(2);
  };

  const joinRoom = async (room) => {
    if (!room.isPrivate) {
      setCurrentRoom(room);
      playBeep(2);
      return;
    }

    const inputPass = prompt("Masukkan password untuk masuk:");
    const ok = await bcrypt.compare(inputPass, room.passwordHash);
    if (!ok) {
      alert("Password salah!");
      return;
    }

    if (!room.allowedUsers || !room.allowedUsers[user.uid]) {
      alert("Kamu belum didaftarkan oleh admin!");
      return;
    }

    setCurrentRoom(room);
    playBeep(2);
  };

  const goNextRoom = () => {
    if (rooms.length === 0) return;
    if (!currentRoom) {
      setCurrentRoom(rooms[0]);
      playBeep(1);
      return;
    }
    const idx = rooms.findIndex((r) => r.id === currentRoom.id);
    const next = rooms[(idx + 1) % rooms.length];
    setCurrentRoom(next);
    playBeep(1);
  };

  const goPrevRoom = () => {
    if (rooms.length === 0) return;
    if (!currentRoom) {
      setCurrentRoom(rooms[0]);
      playBeep(1);
      return;
    }
    const idx = rooms.findIndex((r) => r.id === currentRoom.id);
    const prev = rooms[(idx - 1 + rooms.length) % rooms.length];
    setCurrentRoom(prev);
    playBeep(1);
  };

  const handlePTTDown = () => {
    playBeep(3);
    console.log("Mulai bicara...");
  };

  const handlePTTUp = () => {
    console.log("Stop bicara...");
  };

  const toggleHold = () => {
    setIsHold(!isHold);
    playBeep(3);
    console.log(isHold ? "Stop Hold" : "Mulai Hold");
  };

  return (
    <div className="walkie-container">
      {!user && (
        <div>
          <h3>Login / Register</h3>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <br />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <br />
          <button onClick={handleLogin}>Login</button>
          <button onClick={handleRegister}>Register</button>
        </div>
      )}

      {user && (
        <>
          <div className="screen">
            <p>User: {user.email}</p>
            <p>Role: {role}</p>
            <p>
              Room:{" "}
              {currentRoom ? currentRoom.name : "Belum memilih room"}
            </p>
            <div className="status">
              <span>Sinyal: ████░</span>
              <span>Suara: ▓▓▓▓░</span>
            </div>
            <div className="users-online">
              <p>👥 Online: {onlineUsers.length}</p>
              {onlineUsers.map((u) => (
                <div key={u.id}>- {u.name}</div>
              ))}
            </div>
          </div>

          <select
            className="room-select"
            onChange={(e) => {
              const r = rooms.find((room) => room.id === e.target.value);
              if (r) joinRoom(r);
            }}
            value={currentRoom ? currentRoom.id : ""}
          >
            <option value="">-- pilih Room --</option>
            {rooms.map((room) => (
              <option
                key={room.id}
                value={room.id}
                style={{ color: room.isPrivate ? "red" : "lime" }}
              >
                {room.name}
              </option>
            ))}
          </select>

          <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
            <button onClick={goPrevRoom}>⬆ UP</button>
            <button onClick={goNextRoom}>⬇ DOWN</button>
          </div>

          {role === "admin" && (
            <button onClick={createPrivateRoom}>
              + Buat Room Private
            </button>
          )}

          <button
            className="ptt-btn"
            onMouseDown={handlePTTDown}
            onMouseUp={handlePTTUp}
          >
            PTT
          </button>
          <button className="hold-btn" onClick={toggleHold}>
            {isHold ? "Stop HOLD" : "HOLD"}
          </button>

          <button onClick={handleLogout} style={{ marginTop: 10 }}>
            Logout
          </button>
        </>
      )}
    </div>
  );
}

export default App;
