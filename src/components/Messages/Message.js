import React from 'react';
import styled from 'styled-components';
import moment from 'moment';

const MessageContainer = styled.div`
    background-color: #f4f4f4;
    padding: 10px;
    margin-bottom: 10px;
    border-radius: 5px;
`;

const Meta = styled.p`
    font-weight: bold;
    color: #333;

    span {
        color: #777;
        font-weight: normal;
        margin-left: 8px;
        font-size: 0.85em;
    }
`;

const Text = styled.p`
    margin-top: 5px;
`;

function Message({ message }) {
    const { username, text, time } = message;

    return (
        <MessageContainer>
            <Meta>{username} <span>{moment().format('h:mm a')}</span></Meta>
            <Text>{text}</Text>
        </MessageContainer>
    );
}

export default Message;