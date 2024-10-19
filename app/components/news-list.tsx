import React, { useState, useEffect } from 'react';

interface NewsListProps {
  eventSource: EventSource | null;
}

const NewsList: React.FC<NewsListProps> = ({ eventSource }) => {
  const [newsList, setNewsList] = useState<string[]>([]);

  useEffect(() => {
    if (!eventSource) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'news_list') {
          setNewsList(data.data);
        }
      } catch (error) {
        console.error('解析新闻列表数据时出错:', error);
      }
    };

    eventSource.addEventListener('message', handleMessage);

    return () => {
      eventSource.removeEventListener('message', handleMessage);
    };
  }, [eventSource]);

  return (
    <div className="fixed right-0 top-0 h-full w-1/4 bg-gray-100 p-4 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">热点新闻列表</h2>
      <ul className="list-disc pl-5">
        {newsList.map((news, index) => (
          <li key={index} className="mb-2">{news}</li>
        ))}
      </ul>
    </div>
  );
};

export default NewsList;
