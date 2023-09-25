import React, { useState, useEffect } from 'react';
import { MessageHistory } from './messageHy';

const Bot = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState([]);
  const [ws, setWs] = useState(null);
  const [gptResponse, setGptResponse] = useState('');

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  // Initialize WebSocket connection
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3000/llm');

    socket.addEventListener('open', () => {
      console.log('WebSocket connection established.');
    });

    socket.addEventListener('message', (event) => {
      // Handle incoming messages from the WebSocket server
      try {
        const newMessage = JSON.parse(event.data);

        // Check if newMessage is an object with a 'pastMessages' key
        if (typeof newMessage === 'object' && newMessage.hasOwnProperty('pastMessages')) {
          const filteredMessages = newMessage.pastMessages.filter((message) => message.role !== 'system');
          setMessages((prevMessages) => [...prevMessages, filteredMessages]);
        }
      } catch {
        if (typeof event.data === 'string') {
          setGptResponse((prevResponse) => prevResponse + event.data);
        }
      }
    });

    setWs(socket);
  }, []);

  const sendMessage = () => {
    if (ws && query) {
      if (gptResponse.length > 0) {
        setConversation((prevConversation) => [
          ...prevConversation,
          {
            role: 'assistant',
            content: gptResponse,
          },
        ]);
      }
      setConversation((prevConversation) => [
        ...prevConversation,
        {
          role: 'user',
          content: query,
        },
      ]);
      // Create a message object and send it to the WebSocket server
      setGptResponse('');
      const message = { table: 'pages', columns: 'body, keyword, title, path', query, messages: messages[0] };
      ws.send(JSON.stringify(message));
      setQuery('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div
      className={`fixed bottom-0 right-0 p-4 m-4 bg-gray-100 border border-gray-300 rounded-lg shadow-lg min-h-[100px] ${
        collapsed ? 'w-[50px] h-[50px]' : 'w-[800px] max-h-[80vh] overflow-y-scroll'
      } transition-all duration-300 ease-in-out`}>
      {!collapsed && (
        <>
          <div className="max-h-[60vh] w-[200] overflow-y-scroll">
            <MessageHistory conversation={conversation} />
          </div>
          {gptResponse.length > 0 && (
            <div className="bg-green-200 text-green-800 mr-auto p-2 rounded mb-2 w-2/3 text-start">
              <p>{gptResponse}</p>
            </div>
          )}
          <div className="mt-2">
            <div className="flex items-center justify-between">
              <input
                type="text"
                placeholder="Ask a question..."
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button
                className="ml-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none"
                onClick={sendMessage}>
                Ask
              </button>
            </div>
          </div>
        </>
      )}
      <button
        className="fixed -bottom-12 right-1 mt-2 mr-2 mb-12 p-2 h-12 w-12 bg-gray-300 rounded-full hover:bg-gray-400 focus:outline-none"
        onClick={toggleCollapse}>
        {collapsed ? '+' : '-'}
      </button>
    </div>
  );
};

export default Bot;
