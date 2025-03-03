import { useEffect, useRef, useState } from "react";
import useClickOutside from "../../../helpers/clickOutside";
import {
  addToSearchHistory,
  getSearchHistory,
  removeFromSearch,
  search,
} from "../../../functions/user";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Return, Search } from "../../../svg";
export default function SearchMessMenu({
  color,
  setShowSearchMenu,
  token,
  listMess,
  openChatWindow,
  setShowMessMenu,
  onlineUsers,
}) {
  const { user } = useSelector((user) => ({ ...user }));
  const [iconVisible, setIconVisible] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const menu = useRef(null);
  const input = useRef(null);
  useClickOutside(menu, () => {
    setShowSearchMenu(false);
  });

  useEffect(() => {
    input.current.focus();
  }, []);
  const searchHandler = async (e) => {
    if (searchTerm === "") {
      setResults("");
    } else {
      const searchResults = listMess.rooms.filter((room) => {
        // Chuẩn hóa cả cụm từ tìm kiếm và room_name để tìm kiếm không phân biệt chữ hoa và thường
        const normalizedSearchTerm = searchTerm.toLowerCase();
        const normalizedRoomName = room.room_name.toLowerCase();

        // Kiểm tra xem normalized room_name có chứa normalized search term không
        return normalizedRoomName.includes(normalizedSearchTerm);
      });
      setResults(searchResults);
    }
  };
  console.log(results);
  return (
    <div
      className="header_left search_area scrollbar"
      ref={menu}
      style={{ width: "332px" }}
    >
      <div className="search_wrap">
        <div className="header_logo">
          <div
            className="circle hover1"
            onClick={() => {
              setShowSearchMenu(false);
            }}
          >
            <Return color={color} />
          </div>
        </div>
        <div
          className="search"
          onClick={() => {
            input.current.focus();
          }}
        >
          {iconVisible && (
            <div>
              <Search color={color} />
            </div>
          )}
          <input
            type="text"
            placeholder="Search Facebook"
            ref={input}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyUp={searchHandler}
            onFocus={() => {
              setIconVisible(false);
            }}
            onBlur={() => {
              setIconVisible(true);
            }}
          />
        </div>
      </div>
      <div className="search_results scrollbar">
        {results ? (
          results.map((mess, i) => (
            <>
             
           
                  <div
                    className="mmenu_item hover3"
                    style={{ cursor: "pointer" }}
                    key={i}
                    onClick={() => {
                      setShowMessMenu(false);
                      openChatWindow({
                        _id: mess?.fndInfo?._id,
                        picture: mess?.fndInfo?.picture,
                        first_name: mess?.fndInfo?.first_name,
                        last_name: mess?.fndInfo?.last_name,
                      });
                    }}
                  >
                    <div className="profile_link">
                      <div className="circle_icon_notification">
                        <img
                          src={mess?.fndInfo?.picture}
                          alt=""
                          style={{ width: "56px", height: "56px" }}
                        />
                        <div className="right_bottom_notification">
                          {onlineUsers.some(
                            (user) => user.userId === mess?.fndInfo?._id
                          ) && (
                            <div
                              className="state_active_user_mess"
                              style={{
                                width: "14px",
                                height: "14px",
                                left: "-18px",
                              }}
                            />
                          )}
                        </div>
                      </div>

                      <div>
                        <div
                          className="user_name"
                          style={{ marginLeft: "0px", fontSize: "15px" }}
                        >
                          {mess?.fndInfo?.first_name} {mess?.fndInfo?.last_name}
                        </div>
                        <p
                          style={{
                            fontSize: "13px",
                            color: "#65676B",
                            fontWeight: "400",
                          }}
                        >
                          {mess?.msgInfo?.senderId === user.id && "You: "}
                          {!mess?.msgInfo?.image
                                ? mess?.msgInfo?.message
                                : mess?.msgInfo?.senderId === user.id
                                ? "You sent a photo"
                                : "Someone sent a photo"}
                        </p>
                      </div>
                      {mess?.msgInfo?.status === "unseen" &&
                        mess?.msgInfo?.senderId !== user.id && (
                          <div
                            className="notification_icon_active "
                            style={{
                              width: "10px",
                              right: "2px",
                              position: "absolute",
                            }}
                          />
                        )}
                    </div>
                  </div>
        
       
            </>
          ))
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}
