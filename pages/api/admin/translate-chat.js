import OpenAI from 'openai'
export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'})
  const text=String(req.body?.text||'').trim().slice(0,4000)
  if(!text) return res.status(400).json({error:'Missing text'})
  if(!process.env.OPENAI_API_KEY) return res.status(500).json({error:'Missing OPENAI_API_KEY'})
  try{
    const openai=new OpenAI({apiKey:process.env.OPENAI_API_KEY})
    const completion=await openai.chat.completions.create({
      model:process.env.OPENAI_MODEL||'gpt-4o-mini',temperature:0,
      messages:[
        {role:'system',content:'Detect the message language. If French, return JSON exactly as {"language":"fr","translation":null}. Otherwise translate faithfully into natural French, without adding, interpreting or summarizing. Return JSON as {"language":"<ISO 639-1>","translation":"<French translation>"}.'},
        {role:'user',content:text}
      ],
      response_format:{type:'json_object'}
    })
    const p=JSON.parse(completion.choices?.[0]?.message?.content||'{}')
    res.status(200).json({language:String(p.language||'unknown').slice(0,16),translation:p.translation==null?null:String(p.translation).slice(0,4000)})
  }catch(e){console.error(e);res.status(500).json({error:'Translation failed'})}
}
