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
              }
              p-4
              mb-4
              w-2/3
              rounded
              shadow-sm
              ${
                message.role === 'user'
                  ? 'rounded-tl-[0.9rem] rounded-bl-[0.9rem] rounded-br-[0.9rem]'
                  : message.role === 'assistant'
                  ? 'rounded-bl-[0.9rem] rounded-tr-[0.9rem] rounded-br-[0.9rem]'
                  : ''
              }`}>
              <p>{message.content}</p>
            </div>
          ))
        : null}
    </div>
  );
};
