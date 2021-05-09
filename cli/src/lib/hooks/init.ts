const init = () => {
  // set default chain to devnet
  if  (!process.env.CLUSTER) {
    process.env.CLUSTER = 'devnet';
  }
}

export default init;
