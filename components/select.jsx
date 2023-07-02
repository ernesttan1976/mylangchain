import { PlusOutlined } from '@ant-design/icons';
import { Button, Divider, Input, Select, Space, Tooltip } from 'antd';
const { TextArea } = Input;
import { useRef, useState, useEffect } from 'react';
import styles from "../styles/Home.module.css";

let index = 0;
const SelectComponent = ({ prompts, bot, setBot, setBotImage, setRadio }) => {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const inputRef = useRef(null);
  const inputRef2 = useRef(null);
  const botRef = useRef(null);
  const sRef = useRef([null])

  useEffect(() => {
    setItems(prompts);
  }, [prompts])

  const onNameChange = (event) => {
    setName(event.target.value);
  };
  const onPromptChange = (event) => {
    setPrompt(event.target.value);
  };
  const addItem = (e) => {
    e.preventDefault();
    setItems([...items, { name, prompt }]);
    setName('');
    setPrompt('');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  // "You are a search agent with access to sources in current affairs, calculator and Pinecone store."

  const handleBotChange = (value, option) => {
    if (value) {
      setBot(value);
      setBotImage(prompts[option.index].image)
    } else {
      setBotImage("/images/agent007.png")
      setBot("You are a search agent with access to sources in current affairs, calculator and Pinecone store.")
    }
  }

  // const handleDefault = (value) => {
  //   console.log("onblur")
  //   //setBotImage("/images/agent007.png")
  //   //setBot("You are a search agent with access to sources in current affairs, calculator and Pinecone store.")
  //   botRef.current.setFieldsValue("bot","You are a search agent with access to sources in current affairs, calculator and Pinecone store.")
  // }


  return (
    <Tooltip title={<p>I just want to get started...<br />Choose a Bot prompt<br />or make my own</p>}
      color="#87d068" placement="top" trigger="hover" destroyTooltipOnHide={true}
      arrow={{ pointAtCenter: true }}
      zIndex={1}>
      <Select
        // ref={botRef}
        name="bot"
        className={styles.select}
        placeholder="Choose Your Bot"
        onChange={handleBotChange}
        // default="You are a search agent with access to sources in current affairs, calculator and Pinecone store."
        dropdownRender={(menu) => (
          <>
            {menu}
            <Divider
              style={{
                margin: '8px 0',
              }}
            />
            <Space
              style={{
                padding: '0 8px 4px',
              }}
            >
              <Input
                placeholder="Bot Name"
                ref={inputRef}
                value={name}
                onChange={onNameChange}
                style={{ width: 300 }}
              />
              <Button type="text" icon={<PlusOutlined />} onClick={addItem}>
                Add item
              </Button>
            </Space>
            <TextArea
              style={{
                color: 'white',
                backgroundColor: 'slate',
                borderRadius: 4,
                resize: 'none',
                width: "95%",
                margin: 8,
                marginTop: 4,
                padding: 8
              }}
              ref={inputRef2}
              rows={3}
              maxLength={3000}
              type="text"
              id="userInput"
              name="userInput"
              placeholder="Prompt"
              value={prompt}
              onChange={onPromptChange}
            />
          </>
        )}
        size="large"
        defaultValue = {{
          value: "You are a search agent with access to sources in current affairs, calculator and Pinecone store.",
          label: <div key={index} style={{ display: "flex", flexDirection: "row" }}>
          <img style={{ width: 100, height: 100 }} src="/images/agent007.png" />
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 12 }}>
            <h4 style={{ display: "flex", justifyContent: "flex-left", marginBottom: 0 }}>{"Agent Bot"}</h4><span style={{ display: "flex", fontSize: "0.8rem", textWrap: "wrap", lineHeight: "1.2rem" }}>{"You are a search agent with access to sources in current affairs, calculator and Pinecone store."}</span>
          </div>
        </div>,
        }}
        options={items?.map((item, index) => ({
          value: item.prompt,
          label: <div key={index} style={{ display: "flex", flexDirection: "row" }}>
            <img style={{ width: 100, height: 100 }} src={item.image} />
            <div style={{ display: "flex", flexDirection: "column", marginLeft: 12 }}>
              <h4 style={{ display: "flex", justifyContent: "flex-left", marginBottom: 0 }}>{item.name}</h4><span style={{ display: "flex", fontSize: "0.8rem", textWrap: "wrap", lineHeight: "1.2rem" }}>{item.prompt}</span>
            </div>
          </div>,
          title: item.name + "\n" + item.prompt,
          index: index,
        }))}
      // options={items?.map((item) => ({
      //   label: item.name,
      //   value: item.prompt,
      // }))}
      />
    </Tooltip >
  );
};
export default SelectComponent;