import { Link } from 'react-router-dom';

// YouTube-style description text: any #hashtag inside the string renders as a blue clickable
// link straight to that hashtag's results page (see HashtagPage.jsx) — everything else renders
// as plain text, untouched. Renders a Fragment so the caller controls the wrapping element
// (e.g. keeps the existing <p> and its classes on ProductPage).
export default function HashtagText({ text }) {
  if (!text) return null;

  const parts = [];
  const re = /#(\w+)/g;
  let lastIndex = 0;
  let match;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const tag = match[1];
    parts.push(
      <Link
        key={`${match.index}-${tag}`}
        to={`/hashtag/${encodeURIComponent(tag)}`}
        className="text-hashtag hover:text-hashtag-hover hover:underline font-medium no-underline"
      >
        #{tag}
      </Link>
    );
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return <>{parts}</>;
}
