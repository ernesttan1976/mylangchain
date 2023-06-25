import { PlusOutlined } from '@ant-design/icons';
import { Button, Divider, Input, Select, Space, Tooltip} from 'antd';
const { TextArea } = Input;
import { useRef, useState, useEffect } from 'react';
import styles from "../styles/Home.module.css";

let index = 0;
const SelectComponent = ({ prompts, setBot, setRadio }) => {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const inputRef = useRef(null);
  const inputRef2 = useRef(null);
  const botRef = useRef(null);

  const defaultBotValue = "You are a search agent with access to sources in current affairs, calculator and Pinecone store."
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



  const handleBotChange = (value) => {
    setBot(value);
  }


  return (
    <Tooltip title={<p>I just want to get started...<br/>Choose a Bot prompt<br/>or make my own</p>} 
      color="#87d068" placement="top" trigger="hover" destroyTooltipOnHide={true}
      arrow={{ pointAtCenter: true }}
      zIndex={1}>
    <Select
      className={styles.select}
      placeholder="Choose Your Bot"
      defaultValue="Agent Bot"
      onChange={handleBotChange}
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
              style={{width: 300}}
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
                padding: 8}}
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
      options={items?.map((item) => ({
        value: item.prompt,
        label: <div style={{ display: "flex", flexDirection: "column"}}>
          <h4 style={{ display: "flex", justifyContent: "flex-left"}}>{item.name}</h4><span style={{ display: "flex",fontSize: "0.8rem", textWrap: "wrap" }}>{item.prompt}</span></div>,
        title: item.name +"\n" + item.prompt
      }))}
      // options={items?.map((item) => ({
      //   label: item.name,
      //   value: item.prompt,
      // }))}
    />
    </Tooltip>
  );
};
export default SelectComponent;