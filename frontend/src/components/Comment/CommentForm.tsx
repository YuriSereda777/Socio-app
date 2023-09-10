import { PiNavigationArrowFill } from "react-icons/pi";
import UserImage from "../User/UserImage";
import { useState } from "react";

type Props = {
  postId: string;
  currentUserId: string | undefined;
  currentUserImage: string | undefined;
  currentUserFullName: string | undefined;
};

const CommentForm: React.FC<Props> = ({ postId, currentUserId, currentUserImage, currentUserFullName }) => {
  const classes = "absolute bottom-4 right-6 text-xl text-gray-600 opacity-0 cursor-pointer rotate-[135deg] transition duration-500";
  
  const [text, setText] = useState("");
  const [showSendIcon, setShowSendIcon] = useState(false);
  const [iconClasses, setIconClasses] = useState(classes);

  const changeHandler = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);

    setShowSendIcon(true);
    setIconClasses(e.target.value.trim().length !== 0 ? classes + " !text-sky-500 hover:text-sky-600 hover:scale-110" : classes);
  };

  const focusHandler = () => {
    setIconClasses(classes + " !opacity-100");
  }

  const submitHandler = () => {
    if (text) {
      console.log(text, postId, currentUserId);
      setText("");
      setIconClasses(classes);
    }
  }

  return (
    <div className="flex flex-row gap-3">
      <UserImage
        className="w-10 !mb-0"
        src={currentUserImage}
        alt={currentUserFullName}
        id={currentUserId}
      />
      <form className="w-full">
        <div className="relative w-full">
          <textarea
            className="w-full min-h-[2.5rem] h-fit max-h-[8rem] resize-y pl-4 pr-7 py-1.5 border rounded-xl outline-none"
            placeholder="Write your comment"
            value={text}
            onChange={changeHandler}
            onFocus={focusHandler}
          />
          <PiNavigationArrowFill
            className={
              showSendIcon ? iconClasses + " !opacity-100" : iconClasses
            }
            onClick={submitHandler}
          />
        </div>
      </form>
    </div>
  );
};

export default CommentForm;
