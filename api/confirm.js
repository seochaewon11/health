// 토스페이먼츠 결제 승인 — 프론트에서 받은 paymentKey/orderId/amount를
// 시크릿 키로 서버 간(TossPayments) 승인 요청해 실제 결제를 확정한다.
// 시크릿 키는 절대 클라이언트에 노출하면 안 되므로 Vercel 환경변수
// TOSS_SECRET_KEY로만 주입한다.
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method Not Allowed' });
    return;
  }

  var secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    res.status(500).json({ message: '서버에 TOSS_SECRET_KEY가 설정되어 있지 않습니다' });
    return;
  }

  var body = req.body || {};
  var paymentKey = body.paymentKey;
  var orderId = body.orderId;
  var amount = body.amount;

  if (!paymentKey || !orderId || !amount) {
    res.status(400).json({ message: '필수 값(paymentKey, orderId, amount)이 누락되었습니다' });
    return;
  }

  var authHeader = 'Basic ' + Buffer.from(secretKey + ':').toString('base64');

  try {
    var tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ paymentKey: paymentKey, orderId: orderId, amount: amount })
    });

    var data = await tossRes.json();
    res.status(tossRes.status).json(data);
  } catch (error) {
    res.status(500).json({ message: '결제 승인 요청 중 오류가 발생했습니다' });
  }
};
