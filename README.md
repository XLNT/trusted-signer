# ✒ trusted-signer

This is a super simple typescript microservice that recovers and signs things with a private key. Don't expose this to the internet, obviously.

I made this because I couldn't get recovery and signatures to work in any language but javascript and instead of becoming smarter and learning how elliptic curve math works, I just wrote a microservice in node dot js.

## Deploy

It's a dockerfile, so run something like

```bash
yarn run build
docker build -t shrugs/trusted-signer:latest .
docker run -e "PRIVATE_KEY=0xabcd" -e "PORT=3002" -p 3002:3002 shrugs/trusted-signer:latest
```

(the first two commands are in `make build`)

## Usage

### `GET /recover`

Request
```
{
	"message": "yay digital things\n\ni have code: ropdyl-argnav\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\nand this is me: 0x7E75EdaBCE163EFee3E383Fc7C0a21720367f463",
	"signature": "0xde61021f76f093b8588cd20c7143f7940e02f9c3ed127f726193809b7a92957735bffa08827a1d8e4eb75d248010c70054cb56b201a5d2ba6d86ecb257e9b5481b"
}
```

Response
```
{
    "account": "0x7E75EdaBCE163EFee3E383Fc7C0a21720367f463"
}
```

### `POST /sign`

*NOTE:* right now, the sign endpoint is actually hashing your message and _then_ signing _that hash_. So it might not be exactly what you want. idk, it's what I wanted so that's what it does.

Give it your message as a hex string.

Request
```
{
	"message": "0x09d38b730edd61dc917e2c365e24c2312193e81e7e75edabce163efee3e383fc7c0a21720367f463"
}
```

Response
```
{
    "signature": "0xf33ad4fd8a4b2a442d34afd445720c07f42c431d881d15ea1af883dd34383a9721eae1be166e456410137df313c44e4c8e15764884d9646b76fbaceabe8b651d1b"
}
```
