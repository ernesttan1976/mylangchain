import { PlusOutlined } from '@ant-design/icons';
import { Button, Divider, Input, Select, Space } from 'antd';
import { useRef, useState, useEffect } from 'react';
let index = 0;
const SelectComponent = ({prompts, setBot}) => {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const inputRef = useRef(null);
  const inputRef2 = useRef(null);
  const botRef = useRef(null);

  useEffect(()=>{
    setItems(prompts);
  },[prompts])

  const onNameChange = (event) => {
    setName(event.target.value);
  };
  const onPromptChange = (event) => {
    setPrompt(event.target.value);
  };
  const addItem = (e) => {
    e.preventDefault();
    setItems([...items, {name, prompt}]);
    setName('');
    setPrompt('');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleBotChange = (value)=> {
    setBot(value); 
  }

  const defaultBotValue = "You are an expert pair programmer in Core, Java, Java Spring and Spring Boot. You will provide code, answer questions, give programming challenges based on the user level of proficiency. You will give web links as reference to your answers."

  return (
    <Select
      style={{
        width: 400,
      }}
      placeholder="Choose Your Bot"
      defaultValue={defaultBotValue}
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
            />
            <Input
              placeholder="Prompt"
              ref={inputRef2}
              value={prompt}
              onChange={onPromptChange}
            />
            <Button type="text" icon={<PlusOutlined />} onClick={addItem}>
              Add item
            </Button>
          </Space>
        </>
      )}
      options={items?.map((item) => ({
        label: item.name,
        value: item.prompt,
      }))}
    />
  );
};
export default SelectComponent;