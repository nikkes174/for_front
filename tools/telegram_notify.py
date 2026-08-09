import os
import sys
import urllib.parse
import urllib.request


BOT_TOKEN = '7544629790:AAEsm7c80_Rgr-JvuMFfhzUIuEk4dMxpCug'
USER_ID = '865464502'


def send_message(text: str) -> None:
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"

    data = urllib.parse.urlencode({
        "chat_id": USER_ID,
        "text": text,
    }).encode()

    request = urllib.request.Request(url, data=data)

    with urllib.request.urlopen(request, timeout=15) as response:
        if response.status != 200:
            raise RuntimeError(f"Telegram HTTP {response.status}")


if __name__ == "__main__":
    text = " ".join(sys.argv[1:])
    send_message(text)