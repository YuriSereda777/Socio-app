import { Navigate, Route, Routes } from "react-router-dom";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ErrorPage from "./pages/ErrorPage";

import Navbar from "./components/Navbar";

import MainLayout from "./pages/MainLayout";
import ProfileLayout from "./pages/ProfileLayout";

import Register from "./pages/Register";
import LogIn from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";

import Profile from "./pages/Profile";
import Followers from "./pages/Followers";
import Followings from "./pages/Following";

import Timeline from "./pages/Timeline";
import PostPage from "./pages/PostPage";
import Bookmarks from "./pages/Bookmarks";
import Settings from "./pages/Settings";
import FindFriends from "./pages/FindFriends";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { selectUser, setUser } from "./store/slices/authSlice";
import { io } from "socket.io-client";

import Chats from "./pages/Chats";

const App: React.FC = () => {
  const [navIsSticky, setNavIsSticky] = useState(false);

  const stickyNav = () => {
    window.addEventListener("scroll", () => {
      if (
        document.body.scrollTop > 120 ||
        document.documentElement.scrollTop > 120
      ) {
        setNavIsSticky(true);
      } else {
        setNavIsSticky(false);
      }
    });
  };

  useEffect(() => {
    stickyNav();

    return () => window.removeEventListener("scroll", stickyNav);
  }, []);

  const [isLoading, setIsLoading] = useState(true);
  const user = useSelector(selectUser);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [sendMessage, setSendMessage] = useState(null);
  const [receiveMessage, setReceiveMessage] = useState(null);

  const dispatch = useDispatch();
  const localToken = localStorage.getItem("token");
  useEffect(() => {
    if (!localToken) {
      setIsLoading(false);
      return;
    }
    const fetchToken = async () => {
      try {
        const response = await axios.post(
          "http://localhost:5000/api/v1/validateToken",
          {
            token: localToken,
          }
        );
        dispatch(setUser(response.data.userData));
      } catch (error) {
        console.error(error);
      }
      setIsLoading(false);
    };
    fetchToken();
  }, [dispatch, localToken]);

  const [socketio, setSocket] = useState(io("ws://localhost:8800"));

  useEffect(() => {
    if (user) {
      setSocket(io("ws://localhost:8800"));
      socketio.emit("new-user-add", user?.username);
      socketio.on("get-users", (users) => {
        setOnlineUsers(users);
      });
    }
  }, [user]);

  useEffect(() => {
    socketio.on("receive-message", (data) => {
      setReceiveMessage(data);
    });
  }, []);

  if (isLoading) return;
  return (
    <>
      <Navbar navIsSticky={navIsSticky} />
      <Routes>
        <Route path="*" element={<ErrorPage />} />
        <Route
          path="/register"
          element={!user ? <Register /> : <Navigate to="/" />}
        />
        <Route
          path="/login"
          element={!user ? <LogIn /> : <Navigate to="/" />}
        />
        <Route
          path="/chats"
          element={
            !user ? (
              <LogIn />
            ) : (
              <Chats
                setSendMessage={setSendMessage}
                sendMessage={sendMessage}
                receiveMessage={receiveMessage}
                socket={socketio}
              />
            )
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          element={
            user ? (
              <MainLayout navIsSticky={navIsSticky} />
            ) : (
              <Navigate to="/login" />
            )
          }
        >
          <Route path="/" element={<Timeline />} />
          <Route path="/post/:id" element={<PostPage />} />
          <Route path="/find-friends" element={<FindFriends />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
        </Route>
        <Route
          path="/settings"
          element={
            user ? (
              <Settings navIsSticky={navIsSticky} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route element={user ? <ProfileLayout /> : <Navigate to="/login" />}>
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/profile/:username/followers" element={<Followers />} />
          <Route path="/profile/:username/following" element={<Followings />} />
        </Route>
      </Routes>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        progressStyle={{ backgroundColor: "#0ea5e9" }}
      />
    </>
  );
};

export default App;
