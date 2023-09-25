import React from 'react';

export const MessageHistory = ({ conversation }) => {
  return (
    <div className="flex flex-col overflow-y-scroll">
      {conversation.length > 0
        ? conversation.map((message, index) => (
            <div
              key={index}
              className={`${
                message.role === 'user'
                  ? 'bg-blue-200 text-blue-800 ml-auto text-end'
                  : message.role === 'assistant'
                  ? 'bg-green-200 text-green-800 mr-auto text-start'
                  : ''
              } p-4 rounded mb-4 w-2/3`}>
              <p>{message.content}</p>
            </div>
          ))
        : null}
    </div>
  );
};
