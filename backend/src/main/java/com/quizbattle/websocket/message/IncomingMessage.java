package com.quizbattle.websocket.message;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class IncomingMessage {
    private String type;
    private String answer;
    private Long timestamp;
    private String hostToken;
}
