import { formatDistanceToNow } from "date-fns";

type Props = {
  date: string;
};

const ChatDate: React.FC<Props> = ({ date }) => {
  return (
    <span className="text-xs sm:text-sm text-gray-600 tracking-tight">
      {formatDistanceToNow(new Date(date), {
        addSuffix: true,
      })}
    </span>
  );
};

export default ChatDate;
