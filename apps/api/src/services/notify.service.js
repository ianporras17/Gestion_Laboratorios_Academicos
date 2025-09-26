exports.notify = async (payload) => {
  // inserta en notifications y deja hook futuro de email/FCM
  const { request_id, resource_id, user_id, audience, type, message } = payload;
  await pool.query(
    `INSERT INTO notifications(request_id,resource_id,user_id,audience,type,message)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [request_id||null, resource_id||null, user_id||null, audience||'ENCARGADO', type||'INFO', message||null]
  );
};
