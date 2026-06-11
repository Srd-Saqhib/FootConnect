import React from "react";

function Footer() {
  return (
    <footer style={styles.footer}>
      <p>© 2026 Football Connect</p>
    </footer>
  );
}

const styles = {
  footer: {
    marginTop: "40px",
    padding: "15px",
    textAlign: "center",
    backgroundColor: "#222",
    color: "#fff"
  }
};

export default Footer;
